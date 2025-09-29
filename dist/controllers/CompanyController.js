import { CompanyService } from '@/services/CompanyService.js';
export class CompanyController {
    companyService;
    constructor() {
        this.companyService = new CompanyService();
    }
    getAllCompanies = async (req, res) => {
        try {
            const companies = await this.companyService.getAllCompanies();
            const response = {
                success: true,
                data: companies,
                message: 'Companies retrieved successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Controller error - getAllCompanies:', error);
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve companies'
            };
            res.status(500).json(response);
        }
    };
    getCompanyById = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                const response = {
                    success: false,
                    error: 'Invalid company ID format'
                };
                res.status(400).json(response);
                return;
            }
            const company = await this.companyService.getCompanyById(id);
            const response = {
                success: true,
                data: company,
                message: 'Company retrieved successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error(`Controller error - getCompanyById(${req.params.id}):`, error);
            const statusCode = error instanceof Error && error.message === 'Company not found' ? 404 : 500;
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve company'
            };
            res.status(statusCode).json(response);
        }
    };
    createCompany = async (req, res) => {
        try {
            const companyData = req.body;
            if (!companyData || typeof companyData !== 'object') {
                const response = {
                    success: false,
                    error: 'Invalid request body'
                };
                res.status(400).json(response);
                return;
            }
            const result = await this.companyService.createCompany(companyData);
            const response = {
                success: true,
                data: {
                    id: result.id,
                    company: result.company
                },
                message: 'Company created successfully'
            };
            res.status(201).json(response);
        }
        catch (error) {
            console.error('Controller error - createCompany:', error);
            const statusCode = error instanceof Error &&
                (error.message.includes('required') ||
                    error.message.includes('Invalid') ||
                    error.message.includes('already exists')) ? 400 : 500;
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create company'
            };
            res.status(statusCode).json(response);
        }
    };
    updateCompany = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                const response = {
                    success: false,
                    error: 'Invalid company ID format'
                };
                res.status(400).json(response);
                return;
            }
            const companyData = req.body;
            if (!companyData || typeof companyData !== 'object') {
                const response = {
                    success: false,
                    error: 'Invalid request body'
                };
                res.status(400).json(response);
                return;
            }
            const updatedCompany = await this.companyService.updateCompany(id, companyData);
            const response = {
                success: true,
                data: updatedCompany,
                message: 'Company updated successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error(`Controller error - updateCompany(${req.params.id}):`, error);
            let statusCode = 500;
            if (error instanceof Error) {
                if (error.message === 'Company not found') {
                    statusCode = 404;
                }
                else if (error.message.includes('Invalid') ||
                    error.message.includes('cannot be empty') ||
                    error.message.includes('already exists')) {
                    statusCode = 400;
                }
            }
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update company'
            };
            res.status(statusCode).json(response);
        }
    };
    deleteCompany = async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                const response = {
                    success: false,
                    error: 'Invalid company ID format'
                };
                res.status(400).json(response);
                return;
            }
            await this.companyService.deleteCompany(id);
            const response = {
                success: true,
                message: 'Company deleted successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error(`Controller error - deleteCompany(${req.params.id}):`, error);
            const statusCode = error instanceof Error && error.message === 'Company not found' ? 404 : 500;
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete company'
            };
            res.status(statusCode).json(response);
        }
    };
    getCompanyStats = async (req, res) => {
        try {
            const stats = await this.companyService.getCompanyStats();
            const response = {
                success: true,
                data: stats,
                message: 'Company statistics retrieved successfully'
            };
            res.status(200).json(response);
        }
        catch (error) {
            console.error('Controller error - getCompanyStats:', error);
            const response = {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to retrieve company statistics'
            };
            res.status(500).json(response);
        }
    };
}
//# sourceMappingURL=CompanyController.js.map