import { Router } from 'express';
import { CompanyController } from '../controllers/CompanyController.js';
import { CompanyService } from '../services/CompanyService.js';
import { CompanyRepository } from '../repositories/CompanyRepository.js';
import { QuoteRepository } from '../repositories/QuoteRepository.js';
import { authenticateToken, requireApproved, requireCompanyAccess } from '../middleware/auth.js';

const router = Router();

// Dependency injection
const companyRepository = new CompanyRepository();
const quoteRepository = new QuoteRepository();
const companyService = new CompanyService(companyRepository, quoteRepository);
const companyController = new CompanyController(companyService);

// Apply authentication to all company routes
router.use(authenticateToken);
router.use(requireApproved);

// Company routes
router.get('/stats', companyController.getCompanyStats.bind(companyController));  // Must be before /:id route
router.get('/', companyController.getAllCompanies.bind(companyController));
router.get('/:id', requireCompanyAccess, companyController.getCompanyById.bind(companyController));
router.post('/', companyController.createCompany.bind(companyController));
router.put('/:id', requireCompanyAccess, companyController.updateCompany.bind(companyController));
router.delete('/:id', requireCompanyAccess, companyController.deleteCompany.bind(companyController));
router.post('/:id/increment-quote-number', requireCompanyAccess, companyController.incrementQuoteNumber.bind(companyController));
router.get('/:id/analytics', requireCompanyAccess, companyController.getCompanyAnalytics.bind(companyController));

export default router;