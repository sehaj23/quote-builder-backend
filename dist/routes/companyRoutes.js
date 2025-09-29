import { Router } from 'express';
import { CompanyController } from '@/controllers/CompanyController.js';
const router = Router();
const companyController = new CompanyController();
router.get('/stats', companyController.getCompanyStats);
router.get('/', companyController.getAllCompanies);
router.get('/:id', companyController.getCompanyById);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);
export default router;
//# sourceMappingURL=companyRoutes.js.map