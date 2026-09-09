const service = require('./matters.service');
const { sendResponse } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matters fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user, req.query);
    res.status(200).json(sendResponse(true, 'Matters fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    res.status(201).json(sendResponse(true, 'Matters created successfully', data));
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Matters updated successfully', data));
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user);
    res.status(200).json(sendResponse(true, 'Matters deleted successfully'));
  } catch (err) {
    next(err);
  }
};

const getMatterParties = async (req, res, next) => {
  try {
    const data = await service.getMatterParties(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter parties fetched successfully', data));
  } catch (err) {
    next(err);
  }
};

const bulkDeleteParties = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteParties(req.params.id, req.body.party_ids || req.body.partyIds, req.user);
    res.status(200).json(sendResponse(true, 'Parties deleted successfully', data));
  } catch (err) {
    next(err);
  }
};

const bulkUpdatePartyRoles = async (req, res, next) => {
  try {
    const data = await service.bulkUpdatePartyRoles(req.params.id, req.body.party_ids || req.body.partyIds, req.body.new_roles || req.body.newRoles, req.body.primary_role || req.body.primaryRole, req.user);
    res.status(200).json(sendResponse(true, 'Party roles updated successfully', data));
  } catch (err) {
    next(err);
  }
};

const exportMatterParties = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterParties(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Parties exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_parties.csv`);
      res.status(200).send(data);
    }
  } catch (err) {
    next(err);
  }
};

const importMatterParties = async (req, res, next) => {
  try {
    const data = await service.importMatterParties(req.params.id, req.body.parties || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Parties imported successfully', data));
  } catch (err) {
    next(err);
  }
};

const getMatterVehicles = async (req, res, next) => {
  try {
    const data = await service.getMatterVehicles(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter vehicles fetched successfully', data));
  } catch (err) { next(err); }
};

const addMatterVehicle = async (req, res, next) => {
  try {
    const data = await service.addMatterVehicle(req.params.id, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Vehicle added successfully', data));
  } catch (err) { next(err); }
};

const updateMatterVehicle = async (req, res, next) => {
  try {
    const data = await service.updateMatterVehicle(req.params.id, req.params.vehicleId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Vehicle updated successfully', data));
  } catch (err) { next(err); }
};

const deleteMatterVehicle = async (req, res, next) => {
  try {
    const data = await service.deleteMatterVehicle(req.params.id, req.params.vehicleId, req.user);
    res.status(200).json(sendResponse(true, 'Vehicle deleted successfully', data));
  } catch (err) { next(err); }
};

const bulkDeleteVehicles = async (req, res, next) => {
  try {
    const data = await service.bulkDeleteVehicles(req.params.id, req.body.vehicle_ids || req.body.vehicleIds, req.user);
    res.status(200).json(sendResponse(true, 'Vehicles deleted successfully', data));
  } catch (err) { next(err); }
};

const exportMatterVehicles = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterVehicles(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Vehicles exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_vehicles.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const getMatterDrivers = async (req, res, next) => {
  try {
    const data = await service.getMatterDrivers(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Drivers fetched successfully', data));
  } catch (err) { next(err); }
};

const updateDriverProfile = async (req, res, next) => {
  try {
    const data = await service.updateDriverProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Driver profile updated successfully', data));
  } catch (err) { next(err); }
};

const exportMatterDrivers = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterDrivers(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Drivers exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_drivers.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const bulkUpdateDrivers = async (req, res, next) => {
  try {
    const data = await service.bulkUpdateDrivers(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk driver operation completed successfully', data));
  } catch (err) { next(err); }
};

const importMatterDrivers = async (req, res, next) => {
  try {
    const data = await service.importMatterDrivers(req.params.id, req.body.drivers || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Drivers imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterPassengers = async (req, res, next) => {
  try {
    const data = await service.getMatterPassengers(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Passengers fetched successfully', data));
  } catch (err) { next(err); }
};

const updatePassengerProfile = async (req, res, next) => {
  try {
    const data = await service.updatePassengerProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Passenger profile updated successfully', data));
  } catch (err) { next(err); }
};

const exportMatterPassengers = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterPassengers(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Passengers exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_passengers.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const bulkUpdatePassengers = async (req, res, next) => {
  try {
    const data = await service.bulkUpdatePassengers(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk passenger operation completed successfully', data));
  } catch (err) { next(err); }
};

const importMatterPassengers = async (req, res, next) => {
  try {
    const data = await service.importMatterPassengers(req.params.id, req.body.passengers || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Passengers imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterWitnesses = async (req, res, next) => {
  try {
    const data = await service.getMatterWitnesses(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Witnesses fetched successfully', data));
  } catch (err) { next(err); }
};

const updateWitnessProfile = async (req, res, next) => {
  try {
    const data = await service.updateWitnessProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Witness profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdateWitnesses = async (req, res, next) => {
  try {
    const data = await service.bulkUpdateWitnesses(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk witness operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterWitnesses = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterWitnesses(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Witnesses exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_witnesses.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterWitnesses = async (req, res, next) => {
  try {
    const data = await service.importMatterWitnesses(req.params.id, req.body.witnesses || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Witnesses imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterInsurance = async (req, res, next) => {
  try {
    const data = await service.getMatterInsurance(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Insurance records fetched successfully', data));
  } catch (err) { next(err); }
};

const updateInsuranceProfile = async (req, res, next) => {
  try {
    const data = await service.updateInsuranceProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Insurance profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdateInsurance = async (req, res, next) => {
  try {
    const data = await service.bulkUpdateInsurance(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk insurance operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterInsurance = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterInsurance(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Insurance records exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_insurance.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterInsurance = async (req, res, next) => {
  try {
    const data = await service.importMatterInsurance(req.params.id, req.body.records || req.body.insurance || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Insurance records imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterMedicalProviders = async (req, res, next) => {
  try {
    const data = await service.getMatterMedicalProviders(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Medical providers fetched successfully', data));
  } catch (err) { next(err); }
};

const updateMedicalProviderProfile = async (req, res, next) => {
  try {
    const data = await service.updateMedicalProviderProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Medical provider profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdateMedicalProviders = async (req, res, next) => {
  try {
    const data = await service.bulkUpdateMedicalProviders(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk medical provider operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterMedicalProviders = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterMedicalProviders(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Medical providers exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_medical_providers.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterMedicalProviders = async (req, res, next) => {
  try {
    const data = await service.importMatterMedicalProviders(req.params.id, req.body.records || req.body.providers || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Medical providers imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterEmployers = async (req, res, next) => {
  try {
    const data = await service.getMatterEmployers(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Employers fetched successfully', data));
  } catch (err) { next(err); }
};

const updateEmployerProfile = async (req, res, next) => {
  try {
    const data = await service.updateEmployerProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Employer profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdateEmployers = async (req, res, next) => {
  try {
    const data = await service.bulkUpdateEmployers(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk employer operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterEmployers = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterEmployers(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Employers exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_employers.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterEmployers = async (req, res, next) => {
  try {
    const data = await service.importMatterEmployers(req.params.id, req.body.records || req.body.employers || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Employers imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterPropertyDamage = async (req, res, next) => {
  try {
    const data = await service.getMatterPropertyDamage(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Property damage records fetched successfully', data));
  } catch (err) { next(err); }
};

const updatePropertyDamageProfile = async (req, res, next) => {
  try {
    const data = await service.updatePropertyDamageProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Property damage profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdatePropertyDamage = async (req, res, next) => {
  try {
    const data = await service.bulkUpdatePropertyDamage(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk property damage operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterPropertyDamage = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterPropertyDamage(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Property damage records exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_property_damage.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterPropertyDamage = async (req, res, next) => {
  try {
    const data = await service.importMatterPropertyDamage(req.params.id, req.body.records || req.body.property_damage || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Property damage records imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterPolice = async (req, res, next) => {
  try {
    const data = await service.getMatterPolice(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Police records fetched successfully', data));
  } catch (err) { next(err); }
};

const updatePoliceProfile = async (req, res, next) => {
  try {
    const data = await service.updatePoliceProfile(req.params.id, req.params.partyId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Police profile updated successfully', data));
  } catch (err) { next(err); }
};

const bulkUpdatePolice = async (req, res, next) => {
  try {
    const data = await service.bulkUpdatePolice(req.params.id, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Bulk police operation completed successfully', data));
  } catch (err) { next(err); }
};

const exportMatterPolice = async (req, res, next) => {
  try {
    const format = req.query.format || 'csv';
    const data = await service.exportMatterPolice(req.params.id, format, req.user);
    if (format === 'json') {
      res.status(200).json(sendResponse(true, 'Police records exported successfully', data));
    } else {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=matter_${req.params.id}_police.csv`);
      res.status(200).send(data);
    }
  } catch (err) { next(err); }
};

const importMatterPolice = async (req, res, next) => {
  try {
    const data = await service.importMatterPolice(req.params.id, req.body.records || req.body.police || req.body, req.user);
    res.status(200).json(sendResponse(true, 'Police records imported successfully', data));
  } catch (err) { next(err); }
};

const getMatterTimeline = async (req, res, next) => {
  try {
    const data = await service.getMatterTimeline(req.params.id, req.query, req.user);
    res.status(200).json(sendResponse(true, 'Matter timeline fetched successfully', data));
  } catch (err) { next(err); }
};

const addMatterTimelineEvent = async (req, res, next) => {
  try {
    const data = await service.addMatterTimelineEvent(req.params.id, req.body, req.user);
    res.status(201).json(sendResponse(true, 'Timeline event created successfully', data));
  } catch (err) { next(err); }
};

const updateMatterTimelineEvent = async (req, res, next) => {
  try {
    const data = await service.updateMatterTimelineEvent(req.params.id, req.params.eventId, req.body, req.user);
    res.status(200).json(sendResponse(true, 'Timeline event updated successfully', data));
  } catch (err) { next(err); }
};

const deleteMatterTimelineEvent = async (req, res, next) => {
  try {
    const data = await service.deleteMatterTimelineEvent(req.params.id, req.params.eventId, req.user);
    res.status(200).json(sendResponse(true, 'Timeline event deleted successfully', data));
  } catch (err) { next(err); }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMatterParties,
  bulkDeleteParties,
  bulkUpdatePartyRoles,
  exportMatterParties,
  importMatterParties,
  getMatterVehicles,
  addMatterVehicle,
  updateMatterVehicle,
  deleteMatterVehicle,
  bulkDeleteVehicles,
  exportMatterVehicles,
  getMatterDrivers,
  updateDriverProfile,
  bulkUpdateDrivers,
  exportMatterDrivers,
  importMatterDrivers,
  getMatterPassengers,
  updatePassengerProfile,
  bulkUpdatePassengers,
  exportMatterPassengers,
  importMatterPassengers,
  getMatterWitnesses,
  updateWitnessProfile,
  bulkUpdateWitnesses,
  exportMatterWitnesses,
  importMatterWitnesses,
  getMatterInsurance,
  updateInsuranceProfile,
  bulkUpdateInsurance,
  exportMatterInsurance,
  importMatterInsurance,
  getMatterMedicalProviders,
  updateMedicalProviderProfile,
  bulkUpdateMedicalProviders,
  exportMatterMedicalProviders,
  importMatterMedicalProviders,
  getMatterEmployers,
  updateEmployerProfile,
  bulkUpdateEmployers,
  exportMatterEmployers,
  importMatterEmployers,
  getMatterPropertyDamage,
  updatePropertyDamageProfile,
  bulkUpdatePropertyDamage,
  exportMatterPropertyDamage,
  importMatterPropertyDamage,
  getMatterPolice,
  updatePoliceProfile,
  bulkUpdatePolice,
  exportMatterPolice,
  importMatterPolice,
  getMatterTimeline,
  addMatterTimelineEvent,
  updateMatterTimelineEvent,
  deleteMatterTimelineEvent,
};