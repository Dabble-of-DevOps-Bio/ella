#!/usr/bin/env python

import datetime
import logging
import time
from os import path, mkdir
from collections import defaultdict, OrderedDict
import argparse
import pytz
from sqlalchemy.orm import subqueryload, joinedload
from openpyxl.writer.write_only import WriteOnlyCell
from openpyxl.styles import Font
from openpyxl import Workbook

from vardb.datamodel import DB, assessment, allele
from api.util import alleledataloader


"""
Dump current classification, i.e. alleleassessments for which
AlleleAssessment.date_superceeded == None, to an Excel file
"""

BATCH_SIZE = 200
SCRIPT_DIR = path.abspath(path.dirname(__file__))
log = logging.getLogger(__name__)

REF_FORMAT = u"{title} (Pubmed {pmid}): {evaluation}"

REF_ORDER = ['relevance', 'ref_auth_classification', 'comment']
# Ref evaluation fields, order not specified:
# ['ref_prot', 'ref_population', 'ref_prediction',
#  'ref_prediction_tool', 'ref_segregation',
#  'ref_segregation_quality', 'ref_quality',
#  'ref_prot_quality', 'ref_rna', 'ref_rna_quality', 'sources']

CHROMOSOME_FORMAT = "{chromosome}:{start_position}-{open_end_position}"

DATE_FORMAT = "%Y-%m-%d"

# (field name, [Column header, Column width])
COLUMN_PROPERTIES = OrderedDict([
    ('gene', ['Gene', 6]),
    ('transcript', ['Transcript', 15]),
    ('hgvsc', ['HGVSc', 26]),
    ('class', ['Class', 6]),
    ('date', ['Date', 11]),
    ('hgvsp', ['HGVSp', 26]),
    ('exon', ['#exon or intron/total', 11]),
    ('rsnum', ['RS number', 11]),
    ('consequence', ['Consequence', 20]),
    ('coordinate', ['GRCh37', 20]),
    ('n_samples', ['# samples', 3]),
    ('classification_eval', ['Evaluation', 20]),
    ('report', ['Report', 20]),
    ('acmg_eval', ['ACMG evaluation', 20]),
    ('freq_eval', ['Frequency comment', 20]),
    ('extdb_eval', ['External DB comment', 20]),
    ('pred_eval', ['Prediction comment', 20]),
    ('ref_eval', ['Reference evaluations', 20])
])


def get_batch(alleleassessments):
    """
    Generates lists of AlleleAssessment objects
    :param alleleassessments: An sqlalchemy.orm.query object
    :yield : a list of max BATCH_SIZE AlleleAssessments
    """
    i_batch = 0
    while True:
        batch = alleleassessments.slice(
            i_batch*BATCH_SIZE, (i_batch+1)*BATCH_SIZE
        ).all()

        if batch:
            yield batch
        else:
            raise StopIteration
        i_batch += 1


def format_transcripts(allele_annotation):
    """
    Make dict with info about a transcript for all
    filtered transcript in allele_annotation
    :param allele_annotation: an allele_dict['annotation'] dict
    :return : a dict with info about transcript
    """
    keys = {'gene': 'symbol',
            'transcript': 'transcript',
            'hgvsc': 'HGVSc_short',
            'hgvsp': 'HGVSp',
            'exon': 'exon',
            'intron': 'intron',
            'rsnum': 'dbsnp',
            'consequences': 'consequences'}

    formatted_transcripts = defaultdict(list)
    filtered_transcripts = [t for t in allele_annotation['transcripts'] if t['transcript'] in allele_annotation['filtered_transcripts']]

    # If we have no filtered transcripts, include all of them so we can show something
    if not filtered_transcripts:
        filtered_transcripts = allele_annotation['transcripts']

    for transcript in filtered_transcripts:
        for key, allele_key in keys.items():
            formatted_transcript = transcript.get(allele_key)
            if hasattr(formatted_transcript, '__iter__'):
                formatted_transcript = ', '.join(formatted_transcript)
            if formatted_transcript:
                formatted_transcripts[key].append(formatted_transcript)

    return {key: ' | '.join(value) for key, value in formatted_transcripts.items()}


def format_classification(alleleassessment, adl):
    """
    Make a list of the classification fields of an AlleleAssessment
    :param alleleassessment: an AlleleAssessment object
    :param adl: an AlleleDataLoader object
    :return : list of formatted strings for filtered transcripts
    """

    link_filter = {
        'annotation_id': [alleleassessment.annotation_id]
    }
    allele_dict = adl.from_objs([alleleassessment.allele],
                                link_filter=link_filter,
                                genepanel=alleleassessment.genepanel,
                                include_annotation=True,
                                include_custom_annotation=False,
                                include_allele_assessment=False,
                                include_reference_assessments=False,
                                include_allele_report=True)[0]

    # Imported assessments without date can have 0000-00-00 as created_time. strftime doesn't like that..
    if alleleassessment.date_created < datetime.datetime(year=1950, month=1, day=1, tzinfo=pytz.utc):
        date = '0000-00-00'
    else:
        date = alleleassessment.date_created.strftime(DATE_FORMAT)
    acmg_evals = ' | '.join(
        [': '.join([ae['code'], ae['comment']]) if ae['comment'] else ae['code']
         for ae in alleleassessment.evaluation.get('acmg', {}).get('included', [])]
    )

    # Note that the order of the first ref evaluation fields are specified by
    # REF_ORDER. In order to include all refs, the remaining evaluation keys
    # are added using a set-operation:
    ref_evals = ' | '.join(
        [REF_FORMAT.format(
            title=re.reference.title,
            pmid=re.reference.pubmed_id,
            evaluation=', '.join(
                ['='.join(map(unicode, [key, re.evaluation[key]]))
                 for key in REF_ORDER+list(set(re.evaluation.keys())-set(REF_ORDER))
                 if key in re.evaluation]
            )
        ) for re in alleleassessment.referenceassessments if len(re.evaluation)]
    )

    coordinate = CHROMOSOME_FORMAT.format(
        chromosome=allele_dict['chromosome'],
        start_position=allele_dict['start_position']+1,  # DB is 0-based
        open_end_position=allele_dict['open_end_position']
    )

    formatted_transcript = format_transcripts(allele_dict['annotation'])

    n_samples = len(alleleassessment.allele.genotypes)
    log.debug('Allele %s, %s is found in samples %s' %
              (alleleassessment.allele_id,
               formatted_transcript.get('hgvsc'),
               '|'.join([','.join(map(str, [g.sample_id]))
                         for g in alleleassessment.allele.genotypes])
              )
    )

    classification_values = {
        'gene': formatted_transcript.get('gene'),
        'class': alleleassessment.classification,
        'transcript': formatted_transcript.get('transcript'),
        'hgvsc': formatted_transcript.get('hgvsc'),
        'date': date,
        'hgvsp': formatted_transcript.get('hgvsp'),
        'exon': formatted_transcript.get('exon') or formatted_transcript.get('intron'),
        'rsnum': formatted_transcript.get('rsnum'),
        'consequence': formatted_transcript.get('consequences'),
        'coordinate': coordinate,
        'n_samples': n_samples,
        'classification_eval': alleleassessment.evaluation.get('classification', {}).get('comment', ''),
        'acmg_eval': acmg_evals,
        'report': allele_dict.get('allele_report', {}).get('evaluation', {}).get('comment', ''),
        'freq_eval': alleleassessment.evaluation.get('frequency', {}).get('comment', ''),
        'extdb_eval': alleleassessment.evaluation.get('external', {}).get('comment', ''),
        'pred_eval': alleleassessment.evaluation.get('prediction', {}).get('comment', ''),
        'ref_eval': ref_evals
    }

    return [classification_values[key] for key in COLUMN_PROPERTIES]


def dump_alleleassessments(session, filename):
    """
    Save all current alleleassessments to Excel document
    :param session: An sqlalchemy session
    :param filename:
    """

    if not filename:
        raise RuntimeError("Filename for classification export is mandatory")

    alleleassessments = session.query(assessment.AlleleAssessment).options(
        subqueryload(assessment.AlleleAssessment.annotation).
        subqueryload('allele').joinedload('genotypes'),
        joinedload(assessment.AlleleAssessment.genepanel),
        subqueryload(assessment.AlleleAssessment.referenceassessments).
        joinedload('reference')
    ).filter(
        assessment.AlleleAssessment.date_superceeded.is_(None)
    )


    adl = alleledataloader.AlleleDataLoader(session)

    # Write only: Constant memory usage
    workbook = Workbook(write_only=True)
    worksheet = workbook.create_sheet()

    csv = []
    csv_headers = []
    titles = []
    for ii, cp in enumerate(COLUMN_PROPERTIES.itervalues()):
        csv_headers.append(cp[0])
        title = WriteOnlyCell(worksheet, value=cp[0])
        title.font = Font(bold=True)
        titles.append(title)
        # chr(65) is 'A', chr(66) is 'B', etc
        worksheet.column_dimensions[chr(ii+65)].width = cp[1]

    worksheet.append(titles)
    csv.append(csv_headers)

    t_start = time.time()
    t_total = 0
    rows = list()
    csv_body = []
    for batch_alleleassessments in get_batch(alleleassessments):
        t_query = time.time()
        log.info("Loaded %s allele assessments in %s seconds" %
                 (len(batch_alleleassessments), str(t_query-t_start)))

        for alleleassessment in batch_alleleassessments:
            classification = format_classification(alleleassessment, adl)
            csv_body.append(classification)
            rows.append(classification)

        t_get = time.time()
        log.info("Read the allele assessments in %s seconds" %
                 str(t_get-t_query))
        t_total += t_get-t_start
        t_start = time.time()

    rows.sort(key=lambda x: (x[0], x[1], x[2]))
    csv_body.sort(key=lambda x: (x[0], x[1], x[2]))

    for r in rows:
        worksheet.append(r)
    for r in csv_body:
        csv.append(r)

    log.info("Dumped database in %s seconds" % t_total)

    with open(filename + '.csv', 'w') as csv_file:
        for cols in csv:
            csv_file.write("\t".join(map(str, cols)))
            csv_file.write("\n")

    workbook.save(filename + ".xls")
    log.info("Wrote database to %s.xls/csv" % filename)
