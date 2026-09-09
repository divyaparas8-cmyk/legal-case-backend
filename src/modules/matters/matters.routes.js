const express = require('express');
const router = express.Router();
const controller = require('./matters.controller');
const { protect } = require('../../middlewares/auth.middleware');

router.use(protect);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

router.get('/:id/parties', controller.getMatterParties);
router.post('/:id/parties/bulk-delete', controller.bulkDeleteParties);
router.post('/:id/parties/bulk-role-update', controller.bulkUpdatePartyRoles);
router.get('/:id/parties/export', controller.exportMatterParties);
router.post('/:id/parties/import', controller.importMatterParties);

// ─── Vehicle Routes ───────────────────────────────────────────
router.get('/:id/vehicles', controller.getMatterVehicles);
router.post('/:id/vehicles', controller.addMatterVehicle);
router.put('/:id/vehicles/:vehicleId', controller.updateMatterVehicle);
router.delete('/:id/vehicles/:vehicleId', controller.deleteMatterVehicle);
router.post('/:id/vehicles/bulk-delete', controller.bulkDeleteVehicles);
// ─── Driver Routes ────────────────────────────────────────────
router.get('/:id/drivers', controller.getMatterDrivers);
router.put('/:id/drivers/:partyId', controller.updateDriverProfile);
router.post('/:id/drivers/bulk-update', controller.bulkUpdateDrivers);
router.get('/:id/drivers/export', controller.exportMatterDrivers);
router.post('/:id/drivers/import', controller.importMatterDrivers);
// ─── Passenger Routes ──────────────────────────────────────────
router.get('/:id/passengers', controller.getMatterPassengers);
router.put('/:id/passengers/:partyId', controller.updatePassengerProfile);
router.post('/:id/passengers/bulk-update', controller.bulkUpdatePassengers);
router.get('/:id/passengers/export', controller.exportMatterPassengers);
router.post('/:id/passengers/import', controller.importMatterPassengers);
// ─── Witness Routes ──────────────────────────────────────────
router.get('/:id/witnesses', controller.getMatterWitnesses);
router.put('/:id/witnesses/:partyId', controller.updateWitnessProfile);
router.post('/:id/witnesses/bulk-update', controller.bulkUpdateWitnesses);
router.get('/:id/witnesses/export', controller.exportMatterWitnesses);
router.post('/:id/witnesses/import', controller.importMatterWitnesses);
// ─── Insurance Routes ─────────────────────────────────────────
router.get('/:id/insurance', controller.getMatterInsurance);
router.put('/:id/insurance/:partyId', controller.updateInsuranceProfile);
router.post('/:id/insurance/bulk-update', controller.bulkUpdateInsurance);
router.get('/:id/insurance/export', controller.exportMatterInsurance);
router.post('/:id/insurance/import', controller.importMatterInsurance);
// ─── Medical Provider Routes ──────────────────────────────────
router.get('/:id/medical-providers', controller.getMatterMedicalProviders);
router.put('/:id/medical-providers/:partyId', controller.updateMedicalProviderProfile);
router.post('/:id/medical-providers/bulk-update', controller.bulkUpdateMedicalProviders);
router.get('/:id/medical-providers/export', controller.exportMatterMedicalProviders);
router.post('/:id/medical-providers/import', controller.importMatterMedicalProviders);
// ─── Employer Routes ──────────────────────────────────────────
router.get('/:id/employers', controller.getMatterEmployers);
router.put('/:id/employers/:partyId', controller.updateEmployerProfile);
router.post('/:id/employers/bulk-update', controller.bulkUpdateEmployers);
router.get('/:id/employers/export', controller.exportMatterEmployers);
router.post('/:id/employers/import', controller.importMatterEmployers);
// ─── Property Damage Routes ───────────────────────────────────
router.get('/:id/property-damage', controller.getMatterPropertyDamage);
router.put('/:id/property-damage/:partyId', controller.updatePropertyDamageProfile);
router.post('/:id/property-damage/bulk-update', controller.bulkUpdatePropertyDamage);
router.get('/:id/property-damage/export', controller.exportMatterPropertyDamage);
router.post('/:id/property-damage/import', controller.importMatterPropertyDamage);
// ─── Police Routes ─────────────────────────────────────────────
router.get('/:id/police', controller.getMatterPolice);
router.put('/:id/police/:partyId', controller.updatePoliceProfile);
router.post('/:id/police/bulk-update', controller.bulkUpdatePolice);
router.get('/:id/police/export', controller.exportMatterPolice);
router.post('/:id/police/import', controller.importMatterPolice);
// ─── Timeline Routes ───────────────────────────────────────────
router.get('/:id/timeline', controller.getMatterTimeline);
router.post('/:id/timeline', controller.addMatterTimelineEvent);
router.put('/:id/timeline/:eventId', controller.updateMatterTimelineEvent);
router.delete('/:id/timeline/:eventId', controller.deleteMatterTimelineEvent);

module.exports = router;