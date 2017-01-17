/* jshint esnext: true */

import {Directive, Inject} from '../../ng-decorators';

@Directive({
    selector: 'workflow-analysis',
    scope: {
        'analysisId': '@'
    },
    templateUrl: 'ngtmpl/workflowAnalysis.ngtmpl.html'
})
@Inject('$rootScope',
    '$scope',
    'WorkflowResource',
    'AnalysisResource',
    'Workflow',
    'Navbar',
    'Config',
    'User',
    'AddExcludedAllelesModal',
    'clipboard',
    'toastr')
export class AnalysisController {
    constructor(rootScope,
                scope,
                WorkflowResource,
                AnalysisResource,
                Workflow,
                Navbar,
                Config,
                User,
                AddExcludedAllelesModal,
                clipboard,
                toastr) {
        this.rootScope = rootScope;
        this.scope = scope;
        this.workflowResource = WorkflowResource;
        this.analysisResource = AnalysisResource;
        this.workflowService = Workflow;
        this.addExcludedAllelesModal = AddExcludedAllelesModal;
        this.analysis = null;
        this.active_interpretation = null;
        this.navbar = Navbar;
        this.config = Config.getConfig();
        this.user = User;
        this.clipboard = clipboard;
        this.toastr = toastr;

        this.components = [ // instantiated/rendered in AlleleSectionboxContentController
            {
                title: 'Classification',
                sections: [
                    {
                        title: 'Classification',
                        options: {
                            collapsed: false
                        },
                        controls: [
                            'classification',
                            'reuse_classification'
                        ],
                        alleleassessment_comment: {
                            placeholder: 'EVALUATION',
                            name: 'classification'
                        },
                        report_comment: {
                            placeholder: 'REPORT'
                        },
                        content: [
                            {'tag': 'allele-info-acmg-selection'},
                            {'tag': 'allele-info-vardb'}
                        ],
                    },
                    {
                        title: 'Frequency & QC',
                        options: {
                            collapsed: false
                        },
                        controls: [
                            'copy_alamut',
                            'toggle_class1',
                            'toggle_class2',
                            'toggle_technical'
                        ],
                        alleleassessment_comment: {
                            placeholder: 'FREQUENCY-COMMENTS',
                            name: 'frequency'
                        },
                        content: [
                            {'tag': 'allele-info-frequency-exac'},
                            {'tag': 'allele-info-frequency-thousandg'},
                            {'tag': 'allele-info-frequency-esp6500'},
                            {'tag': 'allele-info-frequency-indb'},
                            {'tag': 'allele-info-dbsnp'},
                            {'tag': 'allele-info-quality'},
                        ],
                    },
                    {
                        title: 'External',
                        options: {
                            collapsed: false
                        },
                        controls: [
                            'custom_external'
                        ],
                        alleleassessment_comment: {
                            placeholder: 'EXTERNAL DB-COMMENTS',
                            name: 'external'
                        },
                        content: [
                            {'tag': 'allele-info-hgmd'},
                            {'tag': 'allele-info-clinvar'},
                            {'tag': 'allele-info-external-other'}
                        ],
                    },
                    {
                        title: 'Prediction',
                        options: {
                            collapsed: false
                        },
                        controls: [
                            'custom_prediction'
                        ],
                        alleleassessment_comment: {
                            placeholder: 'PREDICTION-COMMENTS',
                            name: 'prediction'
                        },
                        content: [
                            {'tag': 'allele-info-consequence'},
                            {'tag': 'allele-info-splice'},
                            {'tag': 'allele-info-prediction-other'},
                        ],
                    },
                    {
                        title: 'References',
                        options: {
                            collapsed: false
                        },
                        controls: [
                            'references'
                        ],
                        content: [
                            {'tag': 'allele-info-references'}
                        ],
                    }
                ]
            },
            {
                title: 'Report',
                alleles: []
            }
        ];
        this.selected_component = this.components[0];

        this.selected_interpretation = null; // Holds displayed interpretation
        this.selected_interpretation_alleles = []; // Loaded alleles for current interpretation
        this.alleles_loaded = false;  // Loading indicators etc

        this.allele_collisions = null;

        this.interpretations = []; // Holds interpretations from backend
        this.history_interpretations = []; // Filtered interpretations, containing only the finished ones. Used in dropdown

        this.setUpListeners();
        this._setWatchers();
        this.setupNavbar();

        this._loadAnalysis();
        this.reloadInterpretationData();
    }

    setUpListeners() {
        // Setup listener for asking user if they really want to navigate
        // away from page if unsaved changes
        let unregister_func = this.rootScope.$on('$stateChangeStart', (event) => {  // TODO: create switch to disable in CI/test
            if (this.config.app.user_confirmation_on_state_change && this.isInterpretationOngoing() && this.selected_interpretation.dirty) {
                this.confirmAbortInterpretation(event);
            }
        });

        // Unregister when scope is destroyed.
        this.scope.$on('$destroy', () => {
            unregister_func();
            window.onbeforeunload = null;
        });

        // Ask user when reloading/closing if unsaved changes
        window.onbeforeunload = (event) => {
            if (this.config.app.user_confirmation_to_discard_changes && this.isInterpretationOngoing() && this.selected_interpretation.dirty) { // TODO: create switch to disable in CI/test
                event.returnValue = "You have unsaved work. Do you really want to exit application?";
            }
        };
    }

    _setWatchers(rootScope) {
        // Watch interpretation's state/user_state and call update whenever it changes
        let watchStateFn = () => {
            if (this.isInterpretationOngoing() &&
                this.selected_interpretation.state) {
                return this.selected_interpretation.state;
            }
        };
        let watchUserStateFn = () => {
            if (this.isInterpretationOngoing() &&
                this.selected_interpretation.user_state) {
                return this.selected_interpretation.user_state;
            }
        };
        this.rootScope.$watch(watchStateFn, (n, o) => {
            // If no old object, we're on the first iteration
            // -> don't set dirty
            if (this.selected_interpretation && o) {
                this.selected_interpretation.setDirty();
            }
        }, true); // true -> Deep watch

        this.rootScope.$watch(watchUserStateFn, (n, o) => {
            if (this.selected_interpretation && o) {
                this.selected_interpretation.setDirty();
            }
        }, true); // true -> Deep watch


        this.rootScope.$watch(
            () => this.selected_interpretation,
            () => {
                this.alleles_loaded = false;  // Make <interpretation> redraw
                this.loadAlleles()
            }
        );
    }

    setupNavbar() {
        let label = this.analysis ? this.analysis.name : '';
        this.navbar.replaceItems([
            {
                title: label,
                url: "/overview"
            }
        ]);
    }

    getExcludedAlleleCount() {
        if (this.selected_interpretation) {
            return Object.values(this.selected_interpretation.excluded_allele_ids)
                .map(excluded_group => excluded_group.length)
                .reduce((total_length, length) => total_length + length);
        }
    }

    /**
     * Popups a dialog for adding excluded alleles
     */
    modalAddExcludedAlleles() {
        if (this.getInterpretation().state.manuallyAddedAlleles === undefined) {
            this.getInterpretation().state.manuallyAddedAlleles = [];
        }
        this.addExcludedAllelesModal.show(
            this.getInterpretation().excluded_allele_ids,
            this.getInterpretation().state.manuallyAddedAlleles,
            this.analysis.samples[0].id, // FIXME: Support multiple samples
            this.getInterpretation().genepanel_name,
            this.getInterpretation().genepanel_version,
            this.readOnly()
        ).then(added => {
            if (this.isInterpretationOngoing()) { // noop if analysis is finalized
                // Uses the result of modal as it's more excplicit than mutating the inputs to the show method
                this.getInterpretation().state.manuallyAddedAlleles = added;
                this.loadAlleles(this.selected_interpretation);
            }
        }).catch(() => {
            this.loadAlleles(this.selected_interpretation);  // Also update on modal dismissal
        });
    }

    confirmAbortInterpretation(event) {
        if (this.isInterpretationOngoing() && !event.defaultPrevented) {
            let choice = confirm('Abort current analysis? Any unsaved changes will be lost!');
            if (!choice) {
                event.preventDefault();
            }
        }
    }

    getInterpretation() {
        // Force selected interpretation to be the Ongoing one, if it exists, to avoid mixups.
        let ongoing_interpretation = this.interpretations.find(i => i.status === 'Ongoing');
        if (ongoing_interpretation) {
            this.selected_interpretation = ongoing_interpretation;
        }

        return this.selected_interpretation;
    }

    isInterpretationOngoing() {
        let interpretation = this.getInterpretation();
        return interpretation && interpretation.status === 'Ongoing';
    }

    readOnly() {
        let interpretation = this.getInterpretation();
        if (!interpretation) {
            return true;
        }

        return !this.isInterpretationOngoing() || interpretation.user.id !== this.user.getCurrentUserId() ;

    }


    showHistory() {
        return !this.isInterpretationOngoing()
               && this.history_interpretations.length;
    }

    reloadInterpretationData() {
        this._loadInterpretations().then(() => {
            this.history_interpretations = this.interpretations.filter(i => i.status === 'Done');
            let last_interpretation = this.interpretations[this.interpretations.length-1];
            // If an interpretation is Ongoing, we assign it directly
            if (last_interpretation.status === 'Ongoing') {
                this.selected_interpretation = last_interpretation;
            }
            // Otherwise, select the last item of the dropdown to show latest history as default
            else if (this.history_interpretations.length) {
                this.selected_interpretation = this.history_interpretations[this.history_interpretations.length-1];
            }
            // If we have no history, select the last interpretation
            else {
                this.selected_interpretation = last_interpretation;
            }
            console.log("Reloaded interpretation data:", this.selected_interpretation)
        });
    }

    loadAlleles() {
        if (this.selected_interpretation) {
            return this.workflowService.loadAlleles(
                'analysis',
                this.analysisId,
                this.selected_interpretation,
            ).then(alleles => {
                this.selected_interpretation_alleles = alleles;
                this.alleles_loaded = true;
            });
        }
    }

    _loadInterpretations() {
        return this.workflowResource.getInterpretations('analysis', this.analysisId).then(interpretations => {
            this.interpretations = interpretations;
            console.log('Loaded ' + interpretations.length + ' interpretations');
        });
    }

    _loadAnalysis() {
        this.analysisResource.getAnalysis(this.analysisId).then(a => {
            this.analysis = a;
            this.setupNavbar();
        });

        this.workflowResource.getCollisions('analysis', this.analysisId).then(c => {
            this.allele_collisions = c;
        });
    }

    copyAlamut() {
        this.clipboard.copyText(
            this.selected_interpretation_alleles.map(a => a.formatAlamut() + '\n').join('')
        );
        this.toastr.info('Copied text to clipboard', null, {timeOut: 1000});
    }

}
