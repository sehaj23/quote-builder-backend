import { Router } from 'express';
import { CompanyController } from '@/controllers/CompanyController.js';

const router = Router();
const companyController = new CompanyController();

// Company routes
router.get('/stats', companyController.getCompanyStats.bind(companyController));  // Must be before /:id route
router.get('/', companyController.getAllCompanies.bind(companyController));
router.get('/:id', companyController.getCompanyById.bind(companyController));
router.post('/', companyController.createCompany.bind(companyController));
router.put('/:id', companyController.updateCompany.bind(companyController));
router.delete('/:id', companyController.deleteCompany.bind(companyController));
router.post('/:id/increment-quote-number', companyController.incrementQuoteNumber.bind(companyController));

export default router;