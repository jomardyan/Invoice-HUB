import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import authService from '../services/AuthService';

export class AuthController {
    static async lookupTenant(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
            return;
        }

        const { email } = req.body;
        const user = await authService.getUserByEmail(email);

        if (!user) {
            res.status(404).json({
                status: 'error',
                statusCode: 404,
                message: 'User not found',
            });
            return;
        }

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            data: {
                tenantId: user.tenantId,
            },
        });
    }

    static async register(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
            return;
        }

        const result = await authService.register(req.body);

        res.status(201).json({
            status: 'success',
            statusCode: 201,
            message: 'User registered successfully',
            data: result,
        });
    }

    static async login(req: Request, res: Response): Promise<void> {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                status: 'error',
                statusCode: 400,
                message: 'Validation failed',
                error: errors.array(),
            });
            return;
        }

        let loginInput = req.body;
        if (!loginInput.tenantId) {
            const tenantLookup = await authService.getUserByEmail(loginInput.email);
            if (!tenantLookup) {
                res.status(404).json({
                    status: 'error',
                    statusCode: 404,
                    message: 'User not found',
                });
                return;
            }
            loginInput = {
                ...loginInput,
                tenantId: tenantLookup.tenantId,
            };
        }

        const result = await authService.login(loginInput);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Login successful',
            data: result,
        });
    }

    static async requestPasswordReset(req: Request, res: Response): Promise<void> {
        const { email, tenantId } = req.body;

        await authService.requestPasswordReset(email, tenantId);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'If the email exists, a password reset link has been sent',
        });
    }

    static async resetPassword(req: Request, res: Response): Promise<void> {
        const { email, tenantId, token, newPassword } = req.body;

        await authService.resetPassword(email, tenantId, token, newPassword);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Password reset successfully',
        });
    }

    static async refreshToken(req: Request, res: Response): Promise<void> {
        const { refreshToken } = req.body;

        const result = await authService.refreshAccessToken(refreshToken);

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Token refreshed successfully',
            data: result,
        });
    }

    static async logout(_req: Request, res: Response): Promise<void> {
        res.clearCookie('refreshToken');

        res.status(200).json({
            status: 'success',
            statusCode: 200,
            message: 'Logged out successfully',
        });
    }
}
