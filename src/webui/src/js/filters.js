/* jshint esnext: true */

import {Filter} from './ng-decorators';


class Filters {

    /*
    Convert one or several gene panel values to a string value
    */

    @Filter({
        filterName: 'gp_values'
    })
    showGenepanelValues() {
        const  marker = v => '*' + v + '*';

        let last_exon_display_values = {true: ['LEI', 'Important'], false: ['LENI', 'Not important']};
        let use_short_version = true;
        let supported_vales = ['last_exon', 'inheritance', 'freq_cutoff', 'disease_mode'];

        return (input, values_to_display) => {
            if (input == undefined || values_to_display == undefined) {
                return '';
            }

            // build an array, then concatenate

            let result = [];

            for (let k of values_to_display) { // the input is a array of wrappers or primitives

                if (! k in supported_vales) {
                    continue;
                }

                if (k == 'freq_cutoff') { // special handling
                    var freqs = [];
                    if (typeof input['hi_freq_cutoff'] == 'object') {
                        freqs.push(marker(input['hi_freq_cutoff']['value']));
                    } else {
                        freqs.push(input['hi_freq_cutoff']);
                    }
                    if (typeof input['lo_freq_cutoff'] == 'object') {
                        freqs.push(marker(input['lo_freq_cutoff']['value']));
                    } else {
                        freqs.push(input['lo_freq_cutoff']);
                    }
                    result.push(freqs.join('/'));
                    continue;
                    }

                if (!k in input) {
                    continue;
                }

                if (typeof input[k] == 'object') { //
                    const v = input[k]['value'];
                    if (k == 'last_exon') { // special handling for short/long version
                        result.push(marker(last_exon_display_values[v][use_short_version ? 0 : 1]));
                    } else {
                        result.push(marker(v));
                    }
                } else {
                    const v = input[k];
                    if (k == 'last_exon') { // special handling for short/long version
                        result.push(last_exon_display_values[v][use_short_version ? 0 : 1]);
                    } else {
                        result.push(v);
                    }
                }
            }
            return result.join('|');
        };
    }

    @Filter({
        filterName: 'split'
    })
    splitFilter() {
        return (input, splitChar, splitIndex) => {
            // do some bounds checking here to ensure it has that index
            if (input !== undefined) {
                return input.split(splitChar)[splitIndex];
            } else {
                return input;
            }
        };
    }

    @Filter({
        filterName: 'isEmpty'
    })
    isEmptyFilter() {
        return (input) => {
            return Object.keys(input).length === 0;
        };
    }

    @Filter({
        filterName: 'default'
    })
    defaultFilter() {
        return (input, text) => {
            return input ? input : text;
        };
    }

    @Filter({
        filterName: 'HGVS_firsthalf'
    })
    HGVS_firsthalfFilter() {
        return (input) => {
            if (input) {
                return input.split(':')[0];
            }
            return '';
        };
    }

    @Filter({
        filterName: 'HGVSc_short'
    })
    HGVSc_shortFilter() {
        return (input) => {
            if (input) {
                return input.split(':')[1];
            }
            return '';
        };
    }

    @Filter({
        filterName: 'HGVSp_short'
    })
    HGVSp_shortFilter() {
        return (input) => {
            if (input) {
                return input.split(':')[1];
            }
            return '';
        };
    }

    @Filter({
        filterName: 'secondsToTimeString'
    })
    secondsToTimeStringFilter() {
        return (seconds) => {
            if (!seconds) {
                return '';
            }
            var days = Math.floor(seconds / 86400);
            var hours = Math.floor((seconds % 86400) / 3600);
            var minutes = Math.floor(((seconds % 86400) % 3600) / 60);
            var timeString = '';
            if(days > 0) timeString += (days > 1) ? (days + " days ") : (days + " day ");
            if(hours > 0) timeString += (hours > 1) ? (hours + "h ") : (hours + "h ");
            if(minutes >= 0) timeString += (minutes > 1) ? (minutes + " min ") : (minutes + " min ");
            return timeString;
        };
    }

    @Filter({
        filterName: 'prettyJSON'
    })
    prettyJSONFilter() {
        return (json) => {
          return JSON ? JSON.stringify(json, null, '  ') : 'your browser doesnt support JSON so cant pretty print';
        }
    }

}

export default Filter;
