import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { User } from '../shared/models/User';

@Injectable()
export class UserService {
    constructor(
        @InjectModel(User) private readonly userModel: typeof User,
    ) {}

    /**
     * Check if a user with the given email exists
     */
    async checkEmailExist(email: string): Promise<boolean> {
        const user = await this.userModel.findOne({ where: { email: email } });
        return !!user;
    }

    /**
     * Check if a user with the given username exists
     */
    async checkUsernameExist(userName: string): Promise<boolean> {
        const user = await this.userModel.findOne({ where: { userName } });
        return !!user;
    }

    /**
     * Find user by email
     */
    async findByEmail(email: string): Promise<User | null> {
        return await this.userModel.findOne({ where: { email } });
    }

    /**
     * Find user by username
     */
    async findByUsername(userName: string): Promise<User | null> {
        return await this.userModel.findOne({ where: { userName } });
    }

    /**
     * Find user by email or username
     */
    async findByEmailOrUsername(email: string, userName: string): Promise<User | null> {
        return await this.userModel.findOne({ 
            where: { 
                [Op.or]: [{ email }, { userName }]
            } 
        });
    }

    /**
     * Create a new user
     */
    async createUser(userData: any): Promise<User> {
        // Handle personal_website properly - ensure it's an array
        const processedData = { ...userData };
        if (processedData.personal_website !== undefined) {
            if (!Array.isArray(processedData.personal_website)) {
                processedData.personal_website = [processedData.personal_website];
            }
        } else {
            processedData.personal_website = [];
        }
        
        // Initialize interests as empty array if not provided
        if (!processedData.interests) {
            processedData.interests = [];
        }
        
        const user = await this.userModel.create(processedData as any);
        return user;
    }

    /**
     * Create user with password (password should already be hashed)
     */
    async createUserWithPassword(hashedPassword: string, userData: {
        email: string;
        name: string;
        userName: string;
        dp_url?: string;
        bio?: string;
        location?: string;
        personal_website?: any;
    }): Promise<User> {
        // Handle personal_website properly - ensure it's an array
        let personalWebsite = userData.personal_website;
        if (!personalWebsite) {
            personalWebsite = [];
        } else if (!Array.isArray(personalWebsite)) {
            // If it's not an array, wrap it
            personalWebsite = [personalWebsite];
        }
        
        const user = await this.userModel.create({
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            userName: userData.userName,
            dp_url: userData.dp_url || '',
            bio: userData.bio || '',
            location: userData.location || '',
            personal_website: personalWebsite,
            interests: [],
            provider: 'local',
        } as any);
        
        return user;
    }

    /**
     * Update user
     */
    async updateUser(userId: string, updates: Partial<User>): Promise<User> {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        await user.update(updates);
        return user;
    }

    /**
     * Find user by ID
     */
    async findById(userId: string): Promise<User | null> {
        return await this.userModel.findByPk(userId);
    }

    /**
     * Find user by provider and providerId
     */
    async findByProvider(provider: string, providerId: string): Promise<User | null> {
        return await this.userModel.findOne({
            where: { provider, providerId }
        });
    }

    /**
     * Update user provider information
     */
    async updateProvider(userId: string, provider: string, providerId: string): Promise<User> {
        return await this.updateUser(userId, { provider, providerId } as any);
    }

    /**
     * Add interest to user
     * Maximum 5 interests allowed
     */
    async addInterest(userId: string, interest: string): Promise<User> {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        // Initialize interests array if not exists
        const currentInterests = user.interests || [];

        // Check if user already has 5 interests
        if (currentInterests.length >= 5) {
            throw new HttpException('Maximum 5 interests allowed', HttpStatus.BAD_REQUEST);
        }

        // Check if interest already exists (case-insensitive)
        const interestLower = interest.toLowerCase().trim();
        if (currentInterests.some(i => i.toLowerCase().trim() === interestLower)) {
            throw new HttpException('Interest already exists', HttpStatus.BAD_REQUEST);
        }

        // Add the interest
        const updatedInterests = [...currentInterests, interest];

        // Update user
        await user.update({ interests: updatedInterests });

        return user;
    }

    /**
     * Remove interest from user
     */
    async removeInterest(userId: string, interest: string): Promise<User> {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }

        const currentInterests = user.interests || [];
        
        // Find and remove the interest (case-insensitive)
        const updatedInterests = currentInterests.filter(
            i => i.toLowerCase().trim() !== interest.toLowerCase().trim()
        );

        // Check if the interest was actually removed
        if (updatedInterests.length === currentInterests.length) {
            throw new HttpException('Interest not found', HttpStatus.NOT_FOUND);
        }

        // Update user
        await user.update({ interests: updatedInterests });

        return user;
    }

    /**
     * Get user interests
     */
    async getUserInterests(userId: string): Promise<string[]> {
        const user = await this.userModel.findByPk(userId);
        if (!user) {
            throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        return user.interests || [];
    }
}
