import processAlleles from '../../../../common/helpers/processAlleles'

function getOverviewAllelesFinalized({ module, http, path, props, state }) {
    const { page: selectedPage } = props

    return http
        .get(`overviews/alleles/finalized/?per_page=10&page=${selectedPage}`)
        .then((response) => {
            for (let item of response.result) {
                processAlleles([item.allele], item.genepanel)
            }
            let result = {
                entries: response.result,
                pagination: {
                    page: parseInt(response.headers['page']),
                    totalCount: parseInt(response.headers['total-count']),
                    perPage: parseInt(response.headers['per-page']),
                    totalPages: parseInt(response.headers['total-pages'])
                }
            }

            return path.success({ result })
        })
        .catch((response) => {
            return path.error(response)
        })
}

export default getOverviewAllelesFinalized
