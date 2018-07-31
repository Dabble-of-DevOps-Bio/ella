import app from '../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state, props, signal } from 'cerebral/tags'
import { compute } from 'cerebral'
import getGenepanelValuesForAllele from '../store/common/computes/getGenepanelValuesForAllele'
import template from './allelebar.ngtmpl.html'

app.component('allelebar', {
    template,
    bindings: {
        allelePath: '<',
        genepanelPath: '<'
    },
    controller: connect(
        {
            allele: state`${props`allelePath`}`,
            genepanel: state`${props`genepanelPath`}`,
            genepanelValuesForAllele: getGenepanelValuesForAllele(
                state`${props`genepanelPath`}`,
                state`${props`allelePath`}`
            )
        },
        'AlleleBar',
        [
            '$scope',
            function($scope) {
                const $ctrl = $scope.$ctrl
                Object.assign($ctrl, {
                    getGenepanelValues: (symbol) => $ctrl.genepanelValuesForAllele[symbol],
                    formatCodons: (codons) => {
                        if (codons === undefined) return

                        let shortCodon = (match, c) => {
                            if (c.length > 10) return `(${c.length})`
                            else return c
                        }

                        return codons
                            .split('/')
                            .map((c) => {
                                return c.replace(/([ACGT]+)/, shortCodon)
                            })
                            .join('/')
                    }
                })
            }
        ]
    )
})
