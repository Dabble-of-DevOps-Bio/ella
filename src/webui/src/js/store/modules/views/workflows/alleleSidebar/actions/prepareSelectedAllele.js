export default function prepareSelectedAllele({ state }) {
    const selectedComponent = state.get('views.workflows.selectedComponent')
    const alleles = state.get('views.workflows.data.alleles')
    const unclassified = state.get('views.workflows.alleleSidebar.unclassified')
    const classified = state.get('views.workflows.alleleSidebar.classified')
    const technical = state.get('views.workflows.alleleSidebar.technical')
    let selectedAllele = state.get('views.workflows.selectedAllele')

    if (selectedComponent !== 'Classification' && selectedComponent !== 'Visualization') {
        state.set('views.workflows.selectedAllele', null)
        return
    }

    // If already selected and it's still valid selection, do nothing
    if (selectedAllele && selectedAllele in alleles) {
        return
    }

    if (unclassified.length) {
        state.set('views.workflows.selectedAllele', unclassified[0])
    } else if (classified.length) {
        state.set('views.workflows.selectedAllele', classified[0])
    } else if (technical.length) {
        state.set('views.workflows.selectedAllele', technical[0])
    } else {
        state.set('views.workflows.selectedAllele', null)
    }
}
