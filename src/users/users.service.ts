import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateUpgradeCost, calculateCritValue } from './constants';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
    constructor(private readonly _prisma: PrismaService) { }

    async findUserById(userId: number) {
        const user = await this._prisma.user.findUnique({ where: { id: userId } });

        if (!user) {
            throw new Error('User not found');
        }

        return {
            id: user.id,
            walletAddress: user.walletAddress || 'No Wallet Linked',
            coins: user.currCoins || 0,
            valueUpgrades: user.valueUpgrades || 1,
            critUpgrades: user.critUpgrades || 1,
        };
    }

    async upgradeCrit(userId: number) {
        const user = await this._prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const currentCritLevel = user.critUpgrades || 0;
        const upgradeCost = calculateUpgradeCost(currentCritLevel, 'crit');

        if (user.currCoins < upgradeCost) {
            console.log('Insufficient coins for upgrade');
            return { error: 'Insufficient coins for upgrade' };
        }
        else {
            const newCritLevel = currentCritLevel + 1;
            const newCritValue = calculateCritValue(newCritLevel);

            await this._prisma.user.update({
                where: { id: userId },
                data: {
                    currCoins: user.currCoins - upgradeCost,
                    critUpgrades: newCritLevel,
                }
            });

            return { newCritLevel, newCritValue, remainingCoins: user.currCoins };
        }
    }

    async upgradeValue(userId: number) {
        const user = await this._prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const currentValueLevel = user.valueUpgrades || 0;
        const upgradeCost = calculateUpgradeCost(currentValueLevel, 'tap');

        if (user.currCoins < upgradeCost) {
            console.log('Insufficient coins for upgrade');
            return { error: 'Insufficient coins for upgrade' };
        }
        else {
            const newValueLevel = currentValueLevel + 1;

            await this._prisma.user.update({
                where: { id: userId },
                data: {
                    currCoins: user.currCoins - upgradeCost,
                    valueUpgrades: newValueLevel,
                }
            });

            return { newValueLevel, remainingCoins: user.currCoins };
        }
    }
}
