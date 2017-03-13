let AlleleSidebar = require('../pageobjects/alleleSidebar')
let AlleleSectionBox = require('../pageobjects/alleleSectionBox')

let util = require('../pageobjects/util');

let alleleSidebar = new AlleleSidebar();
let alleleSectionBox = new AlleleSectionBox();

const SELECTOR_COMMENT_CLASSIFICATION_EDITOR = 'allele-sectionbox .id-comment-classification .wysiwygeditor';

/**
 *
 * Checks the input allele classification data against content in the UI. If the input has more than
 * one allele, we use the allele sidebar to load allele.
 *
 * @param {any} allele_data
 */
function checkAlleleClassification(allele_data) {

    for (let [allele, data] of Object.entries(allele_data)) {

        util.log(`checking classification for allele ${allele}`);

        if (Object.keys(allele_data).length > 1) { // must load the allele by choosing it in the side bar
            expect(alleleSidebar.isAlleleInClassified(allele)).toBe(true);
            alleleSidebar.selectClassifiedAllele(allele);
            expect(alleleSidebar.getSelectedAlleleClassification()).toEqual(data.classification);
        }

        // the 'string' prefix of the option value is auto-generated by Angular:
        expect(alleleSectionBox.getClassificationValue()).toEqual('string:' + data.classification);

        if ('references' in data) {
            for (let [idx, ref_data] of Object.entries(data.references)) {
                expect(alleleSectionBox.getReferenceComment(idx)).toEqual(ref_data.comment);
            }
        }

        if ('evaluation' in data) {
            expect(alleleSectionBox.classificationComment).toEqual(data.evaluation);
        }
        if ('frequency' in data) {
            expect(alleleSectionBox.frequencyComment).toEqual(data.frequency);
        }
        if ('prediction' in data) {
            expect(alleleSectionBox.predictionComment).toEqual(data.prediction);
        }
        if ('external' in data) {
            expect(alleleSectionBox.externalComment).toEqual(data.external);
        }
        if ('report' in data) {
            expect(alleleSectionBox.reportComment).toEqual(data.report);
        }
    }
}

module.exports = checkAlleleClassification;