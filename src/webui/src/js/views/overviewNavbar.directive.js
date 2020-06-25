import app from '../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state, signal } from 'cerebral/tags'

import template from './overviewNavbar.ngtmpl.html'
app.component('overviewNavbar', {
    templateUrl: 'overviewNavbar.ngtmpl.html',
    controller: connect(
        {
            overviewFilter: state`views.overview.filter`,
            filterApplied: state`views.overview.filterApplied`,
            updateFilter: signal`views.overview.updateFilter`,
            clearFilter: signal`views.overview.clearFilter`
        },
        'OverviewNavbar'
    )
})
