/* jshint esnext: true */

import {Directive, Inject} from '../../ng-decorators';

@Directive({
    selector: 'allele-info-clinvar',
    scope: {
        allele: '=',
        cbOptions: '='
    },
    templateUrl: 'ngtmpl/alleleInfoClinvar.ngtmpl.html'
})
@Inject('Config')
export class AlleleInfoClinvar {

    constructor(Config) {
        this.config = Config.getConfig();

        this.checkForContent();
        this.cbOptions.title = "Clinvar";
        this.cbOptions.url = this.allele.getClinvarUrl();
    }

    formatClinvar() {
        let result = [];
        if ('CLINVAR' in this.allele.annotation.external &&
            'CLNSIG' in this.allele.annotation.external.CLINVAR &&
            'CLNREVSTAT' in this.allele.annotation.external.CLINVAR) {
            let clnsigs = this.allele.annotation.external.CLINVAR.CLNSIG.split('|');
            let clnrevstats = this.allele.annotation.external.CLINVAR.CLNREVSTAT.split('|');
            for (let idx = 0; idx < clnsigs.length; idx++) {
                if (clnsigs[idx] in this.config.annotation.clinvar.CLNSIG) {
                    let sigtext = this.config.annotation.clinvar.CLNSIG[clnsigs[idx]];
                    let revtext = this.config.annotation.clinvar.CLNREVSTAT[clnrevstats[idx]];
                    result.push(`${sigtext} (${revtext})`);
                }
            }
        }
        return result;
    }

    checkForContent() {
        if (!this.hasContent()) {
            this.cbOptions.disabled = true;
            this.cbOptions.collapsed = true;
        };
    }


    hasContent() {
        return 'CLINVAR' in this.allele.annotation.external;
    }
}
