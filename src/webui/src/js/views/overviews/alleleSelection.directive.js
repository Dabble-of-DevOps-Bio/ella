'use strict'
/* jshint esnext: true */

import { Directive, Inject } from '../../ng-decorators'

import app from '../../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state, signal } from 'cerebral/tags'

app.component('alleleSelection', {
    templateUrl: 'ngtmpl/alleleSelection-new.ngtmpl.html',
    controller: connect(
        {
            alleles: state`views.overview.data.alleles`,
            finalized: state`views.overview.data.allelesFinalized`
        },
        'AlleleSelection'
    )
})

@Directive({
    selector: 'allele-selection-old',
    templateUrl: 'ngtmpl/alleleSelection.ngtmpl.html'
})
@Inject('$scope', '$interval', 'OverviewResource', 'User')
class AlleleSelectionController {
    constructor($scope, $interval, OverviewResource, User) {
        this.scope = $scope
        this.interval = $interval
        this.overviewResource = OverviewResource
        this.user = User
        this.overview = null
        this.finalized_page = 1
        this.finalized = null // {pagination: obj, data: array}
        this.ongoing_user = [] // Holds filtered list of ongoing alleles belonging to user
        this.ongoing_others = [] // Inverse of above list
        this._setup()
    }

    _setup() {
        this.loadOverview()
        this.pollOverview()
    }

    pollOverview() {
        let cancel = this.interval(() => this.loadOverview(), 60000)
        this.scope.$on('$destroy', () => this.interval.cancel(cancel))
    }

    loadOverview() {
        this.overviewResource.getAllelesOverview().then(data => {
            this.overview = data

            this.ongoing_user = this.overview.ongoing.filter(item => {
                return (
                    item.interpretations[item.interpretations.length - 1].user_id ===
                    this.user.getCurrentUserId()
                )
            })

            this.ongoing_others = this.overview.ongoing.filter(item => {
                return (
                    item.interpretations[item.interpretations.length - 1].user_id !==
                    this.user.getCurrentUserId()
                )
            })
        })

        this.finalizedPageChanged()
    }

    finalizedPageChanged() {
        this.overviewResource.getAllelesFinalizedOverview(this.finalized_page).then(data => {
            this.finalized = data
            this.finalized_page = data.pagination.page
        })
    }
}

export default AlleleSelectionController
