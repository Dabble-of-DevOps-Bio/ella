import app from '../ng-decorators'
import { printedFileSize } from '../util'
import { connect } from '@cerebral/angularjs'
import { state, signal, props } from 'cerebral/tags'
import isReadOnly from '../store/modules/views/workflows/computed/isReadOnly'
import isAlleleAssessmentReused from '../store/modules/views/workflows/interpretation/computed/isAlleleAssessmentReused'
import template from './attachment.ngtmpl.html' // eslint-disable-line no-unused-vars
import popover from './attachmentPopover.ngtmpl.html'

app.component('attachment', {
    bindings: {
        attachmentPath: '<'
    },
    templateUrl: 'attachment.ngtmpl.html',
    controller: connect(
        {
            readOnly: isReadOnly,
            reused: isAlleleAssessmentReused(state`views.workflows.selectedAllele`),
            selectedAllele: state`views.workflows.selectedAllele`,
            attachment: state`${props`attachmentPath`}`,
            removeAttachment: signal`views.workflows.interpretation.removeAttachmentClicked`
        },
        'Attachment',
        [
            '$scope',
            ($scope) => {
                const $ctrl = $scope.$ctrl

                Object.assign($scope.$ctrl, {
                    getMimeType() {
                        let [type, subtype] = $ctrl.attachment.mimetype.split('/')
                        if (subtype.length > 4) {
                            if (type.length > 4) {
                                type = $ctrl.attachment.extension
                            }
                            return type.length > 4 ? '?' : type
                        } else {
                            return subtype
                        }
                    },
                    getType() {
                        let [type, subtype] = $ctrl.attachment.mimetype.split('/')
                        return type
                    },
                    getPopoverTemplate() {
                        return 'attachmentPopover.ngtmpl.html'
                    },
                    getPrintedFileSize() {
                        return printedFileSize($ctrl.attachment.size)
                    },
                    getVisibility() {
                        return $ctrl.readOnly ? 'hidden' : 'visible'
                    }
                })
            }
        ]
    )
})
