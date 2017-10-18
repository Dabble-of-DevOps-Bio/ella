/* jshint esnext: true */


import {Service, Inject} from '../ng-decorators';
import {STATUS_ONGOING, STATUS_NOT_STARTED} from '../model/interpretation'
import {deepCopy} from '../util'

@Service({
    serviceName: 'Interpretation'
})
@Inject('$rootScope', 'WorkflowResource', 'Workflow', 'Allele', 'GenepanelResource', 'User')
class InterpretationService {

    constructor($rootScope, WorkflowResource, Workflow, Allele, GenepanelResource, User) {
        this.rootScope = $rootScope;
        this.workflowResource = WorkflowResource;
        this.workflowService = Workflow;
        this.alleleService = Allele;
        this.genepanelResource = GenepanelResource;
        this.user = User;

        this.resetInterpretations()
        this._setWatchers()
    }

    _setWatchers() {
        // Set interpretation dirty when changes have been made to the state
        let watchStateFn = () => {
            if (this.isInterpretationOngoing() && this.getSelectedInterpretation().state) {
                return this.getSelectedInterpretation().state;
            }
        };

        let watchUserStateFn = () => {
            if (this.isInterpretationOngoing() && this.getSelectedInterpretation().user_state) {
                return this.getSelectedInterpretation().user_state;
            }
        };

        this.rootScope.$watch(watchStateFn, (n, o) => {
            // If no old object, we're on the first iteration
            // -> don't set dirty
            if (this.getSelectedInterpretation() && o) {
                this.getSelectedInterpretation().setDirty();
            }
        }, true); // true -> Deep watch

        this.rootScope.$watch(watchUserStateFn, (n, o) => {
            if (this.getSelectedInterpretation() && o) {
                this.getSelectedInterpretation().setDirty();
            }
        }, true); // true -> Deep watch

        // Reset interpretations whenever we navigate away
        this.rootScope.$on('$locationChangeSuccess', this.resetInterpretations())

    }

    resetInterpretations() {
        this.selected_interpretation = null; // Holds displayed interpretation
        this.selected_interpretation_alleles = null; // Loaded allele for current interpretation (annotation etc data can change based on interpretation snapshot)
        this.selected_interpretation_genepanel = null; // Loaded genepanel for current interpretation (used in navbar)
        this.interpretations = []; // Holds interpretations from backend
        this.history_interpretations = []; // Filtered interpretations, containing only the finished ones. Used in dropdown

        this.type = null;
        this.id = null;
        this.genepanel_name = null;
        this.genepanel_version = null

        // Dummy data for letting the user browse the view before starting interpretation. Never stored!
        // Only used for variants, as variant interpretation is not available by default in the backend
        // Analysis interpretation objects are created on import
        this.dummy_interpretation = {
            genepanel_name: null,
            genepanel_version: null,
            dirty: false,
            state: {},
            user_state: {},
            status: STATUS_NOT_STARTED
        };

        this.dummy_interpretation.setDirty = () => {
            this.dummy_interpretation.dirty = true;
        }

        this.isViewReady = false; // For hiding view until we've checked whether we have interpretations
    }

    /**
     * Load interpretations, alleles, and genepanel (in that order)
     *
     * @param type Type of interpretation (allele or analysis)
     * @param id Id of allele or analysis
     * @param genepanel_name Genepanel name (only applicable for alleles, for analyses it's fetched from interpretation object)
     * @param genepanel_version Genepanel version (only applicable for alleles, for analyses it's fetched from interpretation object)
     * @returns {Promise.<TResult>|*}
     */
    load(type, id, genepanel_name, genepanel_version) {
        return this.loadInterpretations(type, id, genepanel_name, genepanel_version).then( () => {
            this.loadAlleles().then( () => {
                this.loadGenepanel()
            })
        })
    }

    /**
     * Loads interpretations from backend and sets:
     * - selected_interpretation
     * - history_interpretations
     * - interpretations
     */
    loadInterpretations(type, id, genepanel_name, genepanel_version) {
        this.resetInterpretations()
        this.type = type;
        this.id = id;
        this.genepanel_name = genepanel_name;
        this.genepanel_version = genepanel_version;

        if (this.type === "allele") {
            // Set dummy interpretation allele ids for allele interpretations
            // Analysis interpretations should always be present in the database, this is not the case for allele interpretations
            this.dummy_interpretation.allele_ids = [this.id]
            this.dummy_interpretation.genepanel_name = genepanel_name;
            this.dummy_interpretation.genepanel_version = genepanel_version;
        }
        return this.workflowResource.getInterpretations(type, id).then(interpretations => {
            this.interpretations = interpretations;
            let done_interpretations = this.interpretations.filter(i => i.status === 'Done');
            let last_interpretation = this.interpretations[this.interpretations.length - 1];
            // If an interpretation is Ongoing, we assign it directly
            if (last_interpretation && last_interpretation.status === 'Ongoing') {
                this.selected_interpretation = last_interpretation;
                this.selected_interpretation.current = true;
                this.history_interpretations = done_interpretations;
            }
            // Otherwise, make a copy of the last historical one to act as "current" entry.
            // Current means get latest allele data (instead of historical)
            // We make a copy, to prevent the state of the original to be modified
            else if (done_interpretations.length) {
                let current_entry_copy = deepCopy(done_interpretations[done_interpretations.length - 1]);
                current_entry_copy.current = true;
                this.selected_interpretation = current_entry_copy;
                this.history_interpretations = done_interpretations.concat([current_entry_copy]);
            }
            // If we have no history, set selected to last interpretation (undefined if no last_interpretation)
            else {
                this.selected_interpretation = last_interpretation;
                this.history_interpretations = [];
            }
            // this.interpretations_loaded = true;
            console.log('(Re)Loaded ' + interpretations.length + ' interpretations');
            console.log('Setting selected interpretation:', this.selected_interpretation);
            this.interpretations_loaded = true;
        });
    }

    /**
     * Load alleles from interpretation if defined. If not defined, and interpretation type is 'allele',
     * load allele directly from id
     */
    loadAlleles() {
        this.isViewReady = false; // Reloading alleles should trigger a redraw of the view
        if (this.selected_interpretation) {
            return this.workflowService.loadAlleles(
                this.type,
                this.id,
                this.selected_interpretation,
                this.selected_interpretation.current // Whether to show current allele data or historical data
            ).then(alleles => {
                this.selected_interpretation_alleles = alleles;
                // this.alleles_loaded = true;
                this.isViewReady = true;
                console.log("(Re)Loaded alleles from interpretation...", this.selected_interpretation_alleles);
            });
        } else if (this.type === "allele") {
            // Fetch allele directly if no interpretation is set
            return this.alleleService.getAlleles(this.id, null, this.genepanel_name, this.genepanel_version).then(a => {
                console.log(this.genepanel_name, this.genepanel_version)
                return this.alleleService.updateACMG(a, this.genepanel_name, this.genepanel_version, []).then(
                    () => {
                        // this.alleles_loaded = true;
                        this.isViewReady = true;
                        this.alleles = a
                        console.log("(Re)Loaded alleles directly...", this.alleles);
                    }
                );
            });
        }
    }

    loadGenepanel() {
        this.isViewReady = false;
        // let gp_name = this.genepanel_name;
        // let gp_version = this.genepanel_version;
        //
        let interpretation = this.getSelectedInterpretation()
        // if (interpretation) {
        //     gp_name = interpretation.genepanel_name || this.genepanel_name;
        //     gp_version = interpretation.genepanel_version || this.genepanel_version
        // }

        let gp_name = interpretation.genepanel_name;
        let gp_version = interpretation.genepanel_version;


        // if (gp_name && gp_version) {
            return this.genepanelResource.get(gp_name, gp_version).then( (gp) => {
                this.selected_interpretation_genepanel = gp
                this.isViewReady = true;
            });
        // }
    }

    getSelectedInterpretation() {
        // Fall back to dummy interpretation, if selected interpretation is not defined (for alleles only)
        if (this.selected_interpretation) {
            return this.selected_interpretation;
        } else if (this.type === "allele") {
            return this.dummy_interpretation
        }
    }

    getAllInterpretations() {
        return this.interpretations;
    }

    getHistory() {
        return this.history_interpretations;
    }

    isInterpretationOngoing() {
        let interpretation = this.getSelectedInterpretation();
        return interpretation && interpretation.status === 'Ongoing';
    }

    getGenepanel() {
        return this.selected_interpretation_genepanel
    }

    readOnly() {
        let interpretation = this.getSelectedInterpretation();
        if (!interpretation) {
            return true;
        }

        return !this.isInterpretationOngoing() || interpretation.user.id !== this.user.getCurrentUserId() ;
    }

    getAlleles() {
        // Fall back to this.alleles when no interpretation exists on backend
        return this.selected_interpretation_alleles || this.alleles;
    }


}
