import app from '../../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state } from 'cerebral/tags'
import template from './alleleInfoDbsnp.ngtmpl.html' // eslint-disable-line no-unused-vars

app.component('alleleInfoDbsnp', {
    templateUrl: 'alleleInfoDbsnp.ngtmpl.html',
    controller: connect(
        {
            allele: state`views.workflows.interpretation.data.alleles.${state`views.workflows.selectedAllele`}`
        },
        'AlleleInfoDbsnp',
        [
            '$scope',
            function($scope) {
                const $ctrl = $scope.$ctrl

                Object.assign($ctrl, {
                    getUrl(dbsnp) {
                        return `http://www.ncbi.nlm.nih.gov/projects/SNP/snp_ref.cgi?rs=${dbsnp}`
                    },
                    hasContent() {
                        if ($ctrl.allele) {
                            return $ctrl.allele.annotation.filtered.some(
                                (t) => 'dbsnp' in t && t.dbsnp.length
                            )
                        }
                    }
                })
            }
        ]
    )
})
