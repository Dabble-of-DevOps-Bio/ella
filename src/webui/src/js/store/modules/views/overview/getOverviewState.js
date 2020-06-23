import getImportState from './import/getImportState'

export let AVAILABLE_SECTIONS = {
    // All possible sections
    variants: {
        displayName: 'Variants',
        finalized: {
            selectedPage: 1
        }
    },
    analyses: {
        displayName: 'Analyses',
        finalized: {
            selectedPage: 1
        }
    },
    import: {
        displayName: 'Import'
    }
}

export let DEFAULT_FILTER = {
    analysisName: null,
    technology: null,
    dateRange: null,
    priorityNormal: null,
    priorityHigh: null,
    priorityUrgent: null
}

export default function getOverviewState() {
    return {
        sectionKeys: [], // Decided by user's config
        sections: {},
        state: {
            selectedSection: null
        },
        filter: Object.assign({}, DEFAULT_FILTER),
        filteredAnalyses: null,
        data: {
            alleles: null,
            allelesFinalized: null,
            analyses: null,
            analysesFinalized: null
        },
        import: getImportState(),
        importJobsStatus: {}
    }
}
