import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
            const token = authHeader.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'hackathon-secret';

            try {
                const decoded = jwt.verify(token, secret);
                req['user'] = decoded; // ✅ This attaches the user so Controller can read it
            } catch (err) {
                console.log("Token verification failed:", err.message);
                // Optional: throw new UnauthorizedException('Invalid Token');
            }
        }
        
        next();
    }
}