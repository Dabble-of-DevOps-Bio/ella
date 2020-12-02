/* jshint esnext: true */

import app from '../ng-decorators'
import { connect } from '@cerebral/angularjs'
import { state, signal } from 'cerebral/tags'
import template from './userDashboard.ngtmpl.html' // eslint-disable-line no-unused-vars

app.component('userDashboard', {
    templateUrl: 'userDashboard.ngtmpl.html',
    controller: connect({
        user: state`app.user`,
        usersInGroup: state`views.dashboard.data.usersInGroup`,
        userStats: state`views.dashboard.data.userStats`,
        logoutClicked: signal`views.dashboard.logoutClicked`
    })
})
