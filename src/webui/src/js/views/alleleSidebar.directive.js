/* jshint esnext: true */

import {Directive, Inject} from '../ng-decorators';
import {AlleleStateHelper} from '../model/allelestatehelper';

@Directive({
    selector: 'allele-sidebar',
    templateUrl: 'ngtmpl/alleleSidebar.ngtmpl.html',
    scope: {
        genepanel: '=',
        alleles: '=',  // Allele options: { unclassified: [ {allele: Allele, alleleState: {...}, checkable: true, checked: true ] }, classified: [ ... ] }
        selected: '=', // Selected Allele
        readOnly: '=?' // if readOnly the allele can't be added to report
    },
    link: (scope, element) => {
      let scrollFunction = function() {
        let offset = parseInt(window.pageYOffset);
        if (40 <= offset) {
          element.addClass("higher");
        } else {
          element.removeClass("higher");
        }
      };
      angular.element(window).on("scroll", scrollFunction);
      scope.$on('$destroy', function() {
        angular.element(window).off('scroll', scrollFunction);
      });
    }
})
@Inject('Config')
export class AlleleSidebarController {

    constructor(Config) {
        this.config = Config.getConfig();
    }

    select(allele_option) {
        // We have two modes, multiple checkable or normal radio selectiion (of single allele)

        // Multiple (if 'checkable' === true)
        if (this.isTogglable(allele_option)) {
            allele_option.toggle();
        }
        // Single selection
        else {
            this.selected = allele_option.allele;
        }
    }

    isSelected(allele_option) {
        if (!this.selected) {
            return false;
        }

        let matching = this.selected.id === allele_option.allele.id;

        // If checkable is true, we don't support select mode. Set to null
        if (matching && allele_option.checkable) {
            this.selected = null;
            return false;
        }
        return matching;
    }

    isToggled(allele_option) {
        if (this.isTogglable(allele_option)) {
            return allele_option.isToggled();
        }
        return false;
    }

    isTogglable(allele_option) {
        return allele_option.togglable;
    }

    getConsequence(allele) {
        let consequence_priority = this.config.transcripts.consequences;
        let sort_func = (a, b) => {
            return consequence_priority.indexOf(a) - consequence_priority.indexOf(b);
        }
        return allele.annotation.filtered.map(
            t => t.consequences.sort(sort_func)[0].replace('_variant', '')
        ).join(' | ');
    }

    getInheritance(allele) {
        if (this.genepanel) {
            return this.genepanel.getDisplayInheritance(allele.annotation.filtered[0].symbol);
        }
    }

    getClassification(allele, allele_state) {
        return AlleleStateHelper.getClassification(allele, allele_state);
    }
}
