import { set } from 'cerebral/operators'
import { state } from 'cerebral/tags'

export default [set(state`views.workflows.modals.alleleAssessmentHistory`, { show: false })]
