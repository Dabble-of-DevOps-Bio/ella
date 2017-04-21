import pytest
import json
from util import FlaskClientProxy
from api.util.annotationprocessor.genepanelprocessor import BETWEEN_RESULT, BELOW_RESULT, ABOVE_RESULT


@pytest.fixture
def client():
    return FlaskClientProxy()


# Unicode version of str constants:
ABOVE_U = unicode(ABOVE_RESULT, 'utf-8')
BETWEEN_LOWER_U = unicode(BETWEEN_RESULT[0], 'utf-8')
BETWEEN_UPPER_U = unicode(BETWEEN_RESULT[1], 'utf-8')
BELOW_U = unicode(BELOW_RESULT, 'utf-8')

"""
Test the response of /alleles endpoint
"""
class TestAlleleList(object):

    # Maybe not a permanent test. Useful when changing unknown code base
    def test_get_alleles(self, client):

        # ids = [1, 2, 3, 4, 5, 6]
        ids = [1]
        q = {'id': ids}
        response = client.get('/api/v1/alleles/?q={}'.format(json.dumps(q)))

        assert response.status_code == 200

        alleles = response.json
        assert len(alleles) == len(ids)
        assert 'id' in alleles[0]
        for k in ['external', 'frequencies', 'references', 'transcripts']:
            assert k in alleles[0]['annotation']



# Test that genepanel config (deposit_testdata.py) overrides the default cutoff frequencies
# allele with id=1 is for BRCA2; freq of 1000g: 0.02, of esp6500: 0.0003, of ExAC: 0.00106
# Current testdata config: "hi_freq_cutoff": 0.008,
#                          "lo_freq_cutoff": 0.0005

@pytest.mark.parametrize("url, expected_1000g, expected_6500, expected_exac", [
    ('/api/v1/alleles/?q={"id": [6]}&gp_name=HBOC&gp_version=v01', [BETWEEN_LOWER_U, BETWEEN_UPPER_U], BELOW_U, [BETWEEN_LOWER_U, BETWEEN_UPPER_U]),
    ('/api/v1/alleles/?q={"id": [6]}', BELOW_U, BELOW_U, BELOW_U),  # panel not specified, uses default cutoffs
])
def test_calculation_of_cutoffs(client, url, expected_1000g, expected_6500, expected_exac):
    response = client.get(url)
    assert response.status_code == 200

    alleles = response.json
    assert len(alleles) == 1

    our_allele = alleles[0]
    assert 6 == our_allele['id']

    frequency_annotations = our_allele['annotation']['frequencies']
    assert expected_1000g == frequency_annotations['cutoff']['external']['1000g']
    assert expected_exac == frequency_annotations['cutoff']['external']['ExAC']
