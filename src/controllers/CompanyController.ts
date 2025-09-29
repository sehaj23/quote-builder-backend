import { Request, Response } from 'express';
import { CompanyService } from '@/services/CompanyService.js';
import { ApiResponse, CreateCompanyRequest, UpdateCompanyRequest } from '@/types/index.js';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
  }

  // GET /api/companies
  getAllCompanies = async (req: Request, res: Response): Promise<void> => {
    try {
      const companies = await this.companyService.getAllCompanies();
      
      const response: ApiResponse = {
        success: true,
        data: companies,
        message: 'Companies retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Controller error - getAllCompanies:', error);
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve companies'
      };

      res.status(500).json(response);
    }
  };

  // GET /api/companies/:id
  getCompanyById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid company ID format'
        };
        res.status(400).json(response);
        return;
      }

      const company = await this.companyService.getCompanyById(id);
      
      const response: ApiResponse = {
        success: true,
        data: company,
        message: 'Company retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error(`Controller error - getCompanyById(${req.params.id}):`, error);
      
      const statusCode = error instanceof Error && error.message === 'Company not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve company'
      };

      res.status(statusCode).json(response);
    }
  };

  // POST /api/companies
  createCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyData: CreateCompanyRequest = req.body;
      
      // Basic validation
      if (!companyData || typeof companyData !== 'object') {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid request body'
        };
        res.status(400).json(response);
        return;
      }

      const result = await this.companyService.createCompany(companyData);
      
      const response: ApiResponse = {
        success: true,
        data: {
          id: result.id,
          company: result.company
        },
        message: 'Company created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Controller error - createCompany:', error);
      
      const statusCode = error instanceof Error && 
        (error.message.includes('required') || 
         error.message.includes('Invalid') ||
         error.message.includes('already exists')) ? 400 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create company'
      };

      res.status(statusCode).json(response);
    }
  };

  // PUT /api/companies/:id
  updateCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid company ID format'
        };
        res.status(400).json(response);
        return;
      }

      const companyData: UpdateCompanyRequest = req.body;
      
      if (!companyData || typeof companyData !== 'object') {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid request body'
        };
        res.status(400).json(response);
        return;
      }

      const updatedCompany = await this.companyService.updateCompany(id, companyData);
      
      const response: ApiResponse = {
        success: true,
        data: updatedCompany,
        message: 'Company updated successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error(`Controller error - updateCompany(${req.params.id}):`, error);
      
      let statusCode = 500;
      if (error instanceof Error) {
        if (error.message === 'Company not found') {
          statusCode = 404;
        } else if (error.message.includes('Invalid') || 
                   error.message.includes('cannot be empty') ||
                   error.message.includes('already exists')) {
          statusCode = 400;
        }
      }
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update company'
      };

      res.status(statusCode).json(response);
    }
  };

  // DELETE /api/companies/:id
  deleteCompany = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid company ID format'
        };
        res.status(400).json(response);
        return;
      }

      await this.companyService.deleteCompany(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Company deleted successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error(`Controller error - deleteCompany(${req.params.id}):`, error);
      
      const statusCode = error instanceof Error && error.message === 'Company not found' ? 404 : 500;
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete company'
      };

      res.status(statusCode).json(response);
    }
  };

  // GET /api/companies/stats
  getCompanyStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const stats = await this.companyService.getCompanyStats();
      
      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Company statistics retrieved successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Controller error - getCompanyStats:', error);
      
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve company statistics'
      };

      res.status(500).json(response);
    }
  };

  // POST /api/companies/:id/increment-quote-number
  incrementQuoteNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = parseInt(req.params.id);
      
      if (isNaN(companyId)) {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid company ID format'
        };
        res.status(400).json(response);
        return;
      }

      const nextQuoteNumber = await this.companyService.incrementQuoteNumber(companyId);
      
      const response: ApiResponse = {
        success: true,
        data: { nextQuoteNumber },
        message: 'Quote number incremented successfully'
      };

      res.status(200).json(response);
    } catch (error) {
      console.error(`Controller error - incrementQuoteNumber(${req.params.id}):`, error);
      
      const statusCode = error instanceof Error && error.message === 'Company not found' ? 404 : 500;
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to increment quote number'
      };

      res.status(statusCode).json(response);
    }
  };
}