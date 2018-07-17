var Page = require('./page')

const SELECTOR_SEARCH = '.id-search'

const SECTION_EXPAND_SELECTOR = ' header .sb-title-container'
const ALLELE_RESULT_SELECTOR = '.id-search .allele-list a'
const ANALYSIS_RESULT_SELECTOR = '.id-search .analysis-list a'

class Search extends Page {
    open() {
        super.open('overview/')
        browser.waitForExist(SELECTOR_SEARCH)
        if (browser.isExisting(SELECTOR_SEARCH + ' .collapsed')) {
            browser.click(SELECTOR_SEARCH + SECTION_EXPAND_SELECTOR)
        }
    }

    user(username) {
        browser.element('.id-select-user input').setValue(username)
        browser.waitForExist('.selector-optgroup')
    }
    gene(genesymbol) {
        browser.element('.id-select-gene input').setValue('BRCA2')
        browser.waitForExist('.selector-optgroup')
    }

    runSearch() {
        browser.keys('Enter')
    }

    selectType(type) {
        if (type === 'variants') {
            browser.element('.id-search-type:nth-child(1)').click()
        } else if (type === 'analyses') {
            browser.element('.id-search-type:nth-child(2)').click()
        }
    }

    searchFreetext(searchText) {
        browser.element('.id-search-freetext').setValue(searchText)
    }

    getNumberOfAlleles() {
        if (!browser.isExisting(ALLELE_RESULT_SELECTOR)) {
            return 0
        } else {
            return browser.elements(ALLELE_RESULT_SELECTOR).value.length
        }
    }

    getNumberOfAnalyses() {
        if (!browser.isExisting(ANALYSIS_RESULT_SELECTOR)) {
            return 0
        } else {
            return browser.elements(ANALYSIS_RESULT_SELECTOR).value.length
        }
    }

    filterResults() {
        browser.click('label*=Yes')
    }

    noFilterResults() {
        browser.click('label*=No')
    }

    selectFirstAllele() {
        browser.click('.id-search .allele-list:nth-child(1)')
    }

    selectFirstAnalysis() {
        browser.click('.id-search .analysis-list:nth-child(1)')
    }

    getAnalysesForFirstAllele() {
        browser.click('.id-search .allele-list:nth-child(1) .allele-extras button')
        browser.click('button.red')
        let analyses = browser.getText('.modal-content .analysis-list .id-analysis-name')
        if (typeof a === 'string') {
            return [analyses]
        } else {
            return analyses
        }
    }
}

module.exports = Search
