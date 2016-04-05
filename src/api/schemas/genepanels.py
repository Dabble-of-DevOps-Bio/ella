from marshmallow import fields, Schema


class GeneSchema(Schema):
    class Meta:
        fields = ('hugoSymbol',
                  'ensemblGeneID')


class TranscriptSchema(Schema):
    class Meta:
        fields = ('refseqName',
                  'ensemblID',
                  'genomeReference',
                  'chromosome',
                  'txStart',
                  'txEnd',
                  'strand',
                  'cdsStart',
                  'cdsEnd',
                  'exonStarts',
                  # 'exonEndsname', # TODO: <-- why not working?
                  'gene')

    gene = fields.Nested(GeneSchema)


class PhenotypeSchema(Schema):
    class Meta:
        fields = ('genepanelName',
                  'genepanelVersion',
                  'description',
                  'inheritance',
                  'inheritance_info',
                  'omim_id',
                  'pmid',
                  'comment',
                  'gene')

    gene = fields.Nested(GeneSchema)


class GenepanelSchema(Schema):
    class Meta:
        fields = ('name',
                  'version',
                  'transcripts')
    transcripts = fields.Nested(TranscriptSchema, many=True)
    phenotypes = fields.Nested(PhenotypeSchema, many=True)
