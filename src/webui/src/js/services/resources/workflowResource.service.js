/* jshint esnext: true */

import {Service, Inject} from '../../ng-decorators';
import {Interpretation} from '../../model/interpretation';
import {Allele} from '../../model/allele';

/**
 * - retrieve analyses
 * - drive analysis licecycle (start, finalize etc)
 */

@Service({
    serviceName: 'WorkflowResource'
})
@Inject('$resource', 'User')
class WorkflowResource {

    constructor(resource, User) {
        this.base = '/api/v1';
        this.user = User;
        this.resource = resource;
        this.types = {
            allele: 'alleles',
            analysis: 'analyses'
        };
    }

    getInterpretation(type, id, interpretation_id) {
        return new Promise((resolve, reject) => {
            var AnalysisRS = this.resource(`${this.base}/workflows/${this.types[type]}/${id}/interpretations/${interpretation_id}/`);
            var current_interpretation = AnalysisRS.get((data) => {
                resolve(new Interpretation(data));
            });
        });
    }

    getInterpretations(type, id) {
        return new Promise((resolve, reject) => {
            var AnalysisRS = this.resource(`${this.base}/workflows/${this.types[type]}/${id}/interpretations/`);
            var interpretations = AnalysisRS.query(() => {
                resolve(interpretations.map(i => new Interpretation(i)));
            });
        });
    }

    getAlleles(type, id, interpretation_id, allele_ids) {
        return new Promise((resolve, reject) => {
            var AnalysisRS = this.resource(`${this.base}/workflows/${this.types[type]}/${id}/interpretations/${interpretation_id}/alleles/`,
                {allele_ids: allele_ids.join(',')}
            );
            var alleles = AnalysisRS.query(() => {
                resolve(alleles.map(a => new Allele(a)));
            }, reject);
        });
    }

    markreview(type, id, annotations, custom_annotations, alleleassessments, referenceassessments, allelereports) {
        return new Promise((resolve, reject) => {
            this._resourceWithAction(type, 'markreview').doIt(
                { id },
                {
                    user_id: this.user.getCurrentUserId(),
                    annotations: annotations,
                    custom_annotations: custom_annotations,
                    alleleassessments: alleleassessments,
                    referenceassessments: referenceassessments,
                    allelereports: allelereports
                },
                resolve,
                reject
            );
        });
    }

    finalize(type, id, annotations, custom_annotations, alleleassessments, referenceassessments, allelereports) {

        return new Promise((resolve, reject) => {
            this._resourceWithAction(type, 'finalize').doIt(
                { id },
                {
                    user_id: this.user.getCurrentUserId(),
                    annotations: annotations,
                    custom_annotations: custom_annotations,
                    alleleassessments: alleleassessments,
                    referenceassessments: referenceassessments,
                    allelereports: allelereports
                },
                resolve,
                reject
            );
        });
    }

    override(type, id, user_id) {
        return new Promise((resolve, reject) => {
            this._resourceWithAction(type, 'override').doIt(
                { analysisId: id},
                {
                    user_id: user_id
                },
                resolve,
                reject,
            );
        });
    }

    start(type, id, user_id, gp_name=null, gp_version=null) {
        return new Promise((resolve, reject) => {
            this._resourceWithAction(type, 'start').doIt(
                { id },
                {
                    user_id: user_id,
                    gp_name: gp_name,
                    gp_version: gp_version
                },
                resolve,
                reject
            );
        });
    }

    reopen(type, id, user_id) {
        return new Promise((resolve, reject) => {
            this._resourceWithAction(type, 'reopen').doIt(
                { id },
                { user_id: user_id },
                resolve,
                reject
            );
        });
    }

    patchInterpretation(type, id, interpretation) {
        return new Promise((resolve, reject) => {
            var AnalysesRS = this.resource(`${this.base}/workflows/${this.types[type]}/${id}/interpretations/${interpretation.id}/`, {}, {
                update: {
                    method: 'PATCH'
                }
            });
            AnalysesRS.update(
                interpretation,
                resolve,
                reject
            );
        });
    }

    /**
     * Returns information about alleles that are currently being interpreted in
     * analyses _other_ than the provided analysis id, and which doesn't
     * have any existing alleleassessment.
     * @param  {int} id Analysis id
     * @return {Object}    Information about collisions
     */
    getCollisions(id) {
        throw Error("Fix me!");
        return new Promise((resolve, reject) => {
            var CollistionRS = this.resource(`${this.base}/analyses/${id}/collisions/`);
            var data = CollistionRS.query(() => {
                for (let user of data) {
                    user.alleles = user.alleles.map(a => new Allele(a));
                }
                resolve(data);
            }, reject);
        });
    }

    /**
     * Usage:
     *  let MyResource = _resourceWithAction('reopen', 4);
     *  MyResource.doIt(..)
     *
     * @param action
     * @param analysisId
     * @returns an Angular Resource class with a custom action 'doIt'
     * @private
     */
    _resourceWithAction(type, action) {
        return this.resource(`${this.base}/workflows/${this.types[type]}/:id/actions/:action/`,
            { action: action },
            { doIt: { method: 'POST'} }
        );

    }

}

export default WorkflowResource;
