import app from '../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state, signal } from 'cerebral/tags'
import { Compute } from 'cerebral'
import isReadOnly from '../store/modules/views/workflows/computed/isReadOnly'
import { getAcmgCandidates } from '../store/common/helpers/acmg'
import template from './workflowbar.ngtmpl.html'
import acmgSelectiontemplate from './acmgSelectionPopover.ngtmpl.html'
import interpretationLogPopover from './interpretationLogPopover.ngtmpl.html'

let acmgCandidates = Compute(state`app.config`, (config) => {
    return getAcmgCandidates(config)
})

app.component('workflowbar', {
    templateUrl: 'workflowbar.ngtmpl.html',
    controller: connect(
        {
            analysis: state`views.workflows.data.analysis`,
            config: state`app.config`,
            messageCount: state`views.workflows.worklog.messageCount`,
            workflowType: state`views.workflows.type`,
            selectedComponent: state`views.workflows.selectedComponent`,
            componentKeys: state`views.workflows.componentKeys`,
            historyInterpretations: state`views.workflows.historyInterpretations`,
            interpretations: state`views.workflows.data.interpretations`,
            selectedInterpretation: state`views.workflows.interpretation.selected`,
            selectedAlleleId: state`views.workflows.selectedAllele`,
            isOngoing: state`views.workflows.interpretation.isOngoing`,
            genepanels: state`views.workflows.data.genepanels`,
            selectedGenepanel: state`views.workflows.selectedGenepanel`,
            readOnly: isReadOnly,
            acmgCandidates,
            componentChanged: signal`views.workflows.componentChanged`,
            collapseAllAlleleSectionboxClicked: signal`views.workflows.interpretation.collapseAllAlleleSectionboxClicked`,
            selectedInterpretationChanged: signal`views.workflows.selectedInterpretationChanged`,
            copyAllAlamutClicked: signal`views.workflows.copyAllAlamutClicked`,
            copySelectedAlamutClicked: signal`views.workflows.copySelectedAlamutClicked`,
            selectedGenepanelChanged: signal`views.workflows.selectedGenepanelChanged`,
            addAcmgClicked: signal`views.workflows.interpretation.addAcmgClicked`
        },
        'Workflow',
        [
            '$scope',
            '$filter',
            function($scope, $filter) {
                const $ctrl = $scope.$ctrl

                Object.assign($scope.$ctrl, {
                    formatHistoryOption: (interpretation) => {
                        if (interpretation.current) {
                            return 'Current data'
                        }
                        let interpretation_idx = $ctrl.interpretations.indexOf(interpretation) + 1
                        let interpretation_date = $filter('date')(
                            interpretation.date_last_update,
                            'yyyy-MM-dd'
                        )
                        return `${interpretation_idx} • ${interpretation.workflow_status}${
                            interpretation.finalized ? ' (Finalized)' : ''
                        } • ${interpretation.user.abbrev_name} • ${interpretation_date}`
                    },
                    showComponentDropdown: () => {
                        return Boolean($ctrl.components.length > 1)
                    },
                    showHistory: () => {
                        return (
                            !$ctrl.isOngoing &&
                            $ctrl.historyInterpretations &&
                            $ctrl.historyInterpretations.length
                        )
                    },
                    //
                    // Add ACMG popover
                    //
                    acmgPopover: {
                        templateUrl: 'acmgSelectionPopover.ngtmpl.html',
                        categories: ['Pathogenic', 'Benign'],
                        selectedCategory: 'Pathogenic',
                        getAcmgClass(code) {
                            let acmgclass = code.substring(0, 2).toLowerCase()
                            return code.includes('x') ? `indented ${acmgclass}` : acmgclass
                        },
                        getExplanationForCode(code) {
                            return $ctrl.config.acmg.explanation[code]
                        },
                        stageAcmgCode(code) {
                            let existingComment = $ctrl.stagedAcmgCode
                                ? $ctrl.stagedAcmgCode.comment
                                : ''
                            $ctrl.stagedAcmgCode = {
                                code: code,
                                comment: existingComment,
                                source: 'user',
                                op: null,
                                match: null
                            }
                        },
                        addStagedAcmgCode() {
                            if ($ctrl.stagedAcmgCode) {
                                $ctrl.addAcmgClicked({
                                    alleleId: $ctrl.selectedAlleleId,
                                    code: $ctrl.stagedAcmgCode
                                })
                            }
                            $ctrl.stagedAcmgCode = null
                        }
                    },
                    interpretationLogPopover: {
                        templateUrl: 'interpretationLogPopover.ngtmpl.html'
                    }
                })
            }
        ]
    )
})
