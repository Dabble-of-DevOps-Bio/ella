import processAnalyses from '../../../../common/helpers/processAnalyses'

export default function getOverviewAnalyses({ http, props, path, state }) {
    return http
        .get('overviews/analyses/')
        .then((response) => {
            const keys = [
                'not_ready',
                'not_started',
                'ongoing',
                'marked_review',
                'marked_medicalreview'
            ]

            for (let key of keys) {
                for (let item of response.result[key]) {
                    processAnalyses([item])
                }
            }

            response.result.ongoing_user = response.result.ongoing.filter((item) => {
                return (
                    item.interpretations[item.interpretations.length - 1].user_id ===
                    state.get('app.user.id')
                )
            })

            response.result.ongoing_others = response.result.ongoing.filter((item) => {
                return (
                    item.interpretations[item.interpretations.length - 1].user_id !==
                    state.get('app.user.id')
                )
            })

            delete response.result.ongoing
            return path.success(response)
        })
        .catch((error) => {
            console.error(error)
            return path.error(error)
        })
}
