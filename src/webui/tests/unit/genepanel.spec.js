import Genepanel from '../../src/js/model/genepanel'

const genepanel_defaults = {
    'disease_mode': "ANY",
    'inheritance': "AD",
    'last_exon': true,
    'freq_cutoffs': {
        'AD': {
            'external': {
                'hi_freq_cutoff': 0.0005,
                'lo_freq_cutoff': 0.0001
            },
            'internal': {
                'hi_freq_cutoff': 0.05,
                'lo_freq_cutoff': 1
            }
        },
        'default': {
            'external': {
                'hi_freq_cutoff': 0.01,
                'lo_freq_cutoff': 1
            },
            'internal': {
                'hi_freq_cutoff': 0.05,
                'lo_freq_cutoff': 1
            }
        }
    }
};

describe("Model Genepanel", function() {

    function createPanel(includeConfig) {
        let config = {
            'data': {
                'BRCA1': {
                    'inheritance': 'XX',
                    'last_exon': false,
                    'freq_cutoffs': {
                        'external': {
                            'hi_freq_cutoff': 0.98,
                            'lo_freq_cutoff': 1
                        },
                        'internal': {
                            'hi_freq_cutoff': 0.99,
                            'lo_freq_cutoff': 1
                        }
                    }
                },
                'BRCA3': {'inheritance': 'XX'}

            }
        };

        let genepanel = {
            'phenotypes': [
                {'gene': {'hugo_symbol': 'BRCA1'}, 'inheritance': 'AD'},
                {'gene': {'hugo_symbol': 'BRCA2'}, 'inheritance': 'AR', 'description': "a phenotype"},
                {'gene': {'hugo_symbol': 'BRCA1'}, 'inheritance': 'AD'},
                {'gene': {'hugo_symbol': 'BRCA1'}, 'inheritance': ''}
            ]
        };

        if (includeConfig) {
            genepanel['config'] = config;
        }
        return genepanel;
    }

    it("can be constructed", function () {
        expect(new Genepanel({'id': 12})).toBeDefined();
    });

    it("can find inheritance from phenotypes", function () {
        expect(new Genepanel(createPanel(false)).getInheritanceCodes('BRCA1')).toBe('AD');
    });

    it("can filter phenotypes by gene symbol", function () {
        let phenotypes = new Genepanel(createPanel(false)).phenotypesBy('BRCA2');
        expect(phenotypes[0]['description']).toBe('a phenotype');
    });

    it("handles missing genepanel config", function () {
        let gene_override = false;
        let data = {'id': 1, 'genepanel': createPanel(gene_override)};
        let overrides = new Genepanel(createPanel(false)).findGeneConfigOverride('BRCA1');
        expect(overrides).toBeDefined();
    });

    it("can find inheritance from genepanel config", function () {
        expect(new Genepanel(createPanel(true)).getInheritanceCodes('BRCA1')).toBe('XX');
    });

    it("can find genepanel config overrides for last_exon and inheritance", function() {

        let genepanelConfig_brca1 = new Genepanel(createPanel(true)).calculateGenepanelConfig('BRCA1', genepanel_defaults);
        expect(typeof genepanelConfig_brca1['inheritance']).toBe('string'); // now wrapper for inheritance
        expect(genepanelConfig_brca1['inheritance']).toBe('XX');
        expect(genepanelConfig_brca1['_overridden']).toContain('inheritance');
        expect(genepanelConfig_brca1['last_exon']).toBe(false);
        expect(genepanelConfig_brca1['_overridden']).toContain('last_exon');

        let genepanelConfig_brca3 = new Genepanel(createPanel(true)).calculateGenepanelConfig('BRCA3', genepanel_defaults);
        expect(genepanelConfig_brca3['last_exon']).toBe(true);
        expect(genepanelConfig_brca3['_overridden']).toContain('inheritance');
    });

    it("can find genepanel config overrides for frequence cutoffs", function () {

        let genepanelConfig_brca1 = new Genepanel(createPanel(true)).calculateGenepanelConfig('BRCA1', genepanel_defaults);
        expect(genepanelConfig_brca1['_overridden']).toContain('freq_cutoffs');

        expect(genepanelConfig_brca1['freq_cutoffs']['external']['hi_freq_cutoff']).toBe(0.98);
        expect(genepanelConfig_brca1['freq_cutoffs']['external']['lo_freq_cutoff']).toBe(1);
        expect(genepanelConfig_brca1['freq_cutoffs']['internal']['hi_freq_cutoff']).toBe(0.99);
        expect(genepanelConfig_brca1['freq_cutoffs']['internal']['lo_freq_cutoff']).toBe(1);

        let genepanelConfig_brca3 = new Genepanel(createPanel(false)).calculateGenepanelConfig('BRCA3', genepanel_defaults);

        expect(genepanelConfig_brca3['freq_cutoffs']['external']['hi_freq_cutoff']).toBe(0.01);
        expect(genepanelConfig_brca3['freq_cutoffs']['external']['lo_freq_cutoff']).toBe(1);
        expect(genepanelConfig_brca3['freq_cutoffs']['internal']['hi_freq_cutoff']).toBe(0.05);
        expect(genepanelConfig_brca3['freq_cutoffs']['internal']['lo_freq_cutoff']).toBe(1);

    })



});
