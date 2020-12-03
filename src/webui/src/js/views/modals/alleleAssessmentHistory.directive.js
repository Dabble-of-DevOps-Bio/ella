/* jshint esnext: true */

import app from '../../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { signal, state } from 'cerebral/tags'
import { Compute } from 'cerebral'
import template from './alleleAssessmentHistory.ngtmpl.html'

const combinedAssessmentsReport = Compute(
    state`views.workflows.modals.alleleAssessmentHistory.data.alleleassessments`,
    state`views.workflows.modals.alleleAssessmentHistory.data.allelereports`,
    (alleleAssessments, alleleReports) => {
        // Join allele reports and allele assessments created together. This is done by assuming that allele reports
        // and allele assessments created within 10 seconds of each other are created together.
        if (alleleAssessments === undefined || alleleReports == undefined) {
            return []
        }

        let summaryItems = []
        for (let aa of alleleAssessments) {
            summaryItems.push({ alleleAssessment: aa, alleleReport: null })
        }

        for (let ar of alleleReports) {
            // Find first item created before (or within 10 seconds) of allele report
            let idx = summaryItems.findIndex((item) => {
                let d1 = item.alleleAssessment
                    ? item.alleleAssessment.seconds_since_update
                    : item.alleleReport.seconds_since_update
                let d2 = ar.seconds_since_update

                return d2 < d1 + 10
            })

            let aa = summaryItems[idx].alleleAssessment
            if (Math.abs(aa.seconds_since_update - ar.seconds_since_update) < 10) {
                summaryItems[idx].alleleReport = ar
            } else {
                summaryItems.splice(idx, 0, { alleleAssessment: null, alleleReport: ar })
            }
        }

        return summaryItems
    }
)

app.component('alleleAssessmentHistory', {
    templateUrl: 'alleleAssessmentHistory.ngtmpl.html',
    controller: connect(
        {
            alleleAssessments: state`views.workflows.modals.alleleAssessmentHistory.data.alleleassessments`,
            selectedMode: state`views.workflows.modals.alleleAssessmentHistory.selectedMode`,
            selected: state`views.workflows.modals.alleleAssessmentHistory.selected`,
            alleleReports: state`views.workflows.modals.alleleAssessmentHistory.data.allelereports`,
            summaryItems: combinedAssessmentsReport,
            selectedModeChanged: signal`views.workflows.modals.alleleAssessmentHistory.selectedModeChanged`,
            selectedChanged: signal`views.workflows.modals.alleleAssessmentHistory.selectedChanged`,
            dismissClicked: signal`views.workflows.modals.alleleAssessmentHistory.dismissClicked`
        },
        'AlleleAssessmentHistory',
        [
            '$scope',
            ($scope) => {
                const $ctrl = $scope.$ctrl

                Object.assign($ctrl, {
                    close() {
                        $ctrl.dismissClicked()
                    },
                    formatDate(aa) {
                        return new Date(aa.date_created).toISOString().split('T')[0]
                    },
                    formatSelection(element) {
                        let selection = `${$ctrl.formatDate(element)}: `

                        if ($ctrl.selectedMode === 'classification') {
                            selection += `Class ${element.classification} by ${element.user.abbrev_name} on ${element.genepanel_name}_${element.genepanel_version}`
                        } else {
                            selection += `Report changed by ${element.user.abbrev_name}`
                        }
                        return selection
                    },
                    getDropdownItems() {
                        if ($ctrl.selectedMode === 'classification') {
                            return $ctrl.alleleAssessments
                        } else {
                            return $ctrl.alleleReports
                        }
                    }
                })
            }
        ]
    )
})
