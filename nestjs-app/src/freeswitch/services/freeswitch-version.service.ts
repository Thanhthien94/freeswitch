import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  FreeSwitchConfigVersion, 
  FreeSwitchConfigType,
  FreeSwitchConfigDeployment 
} from '../entities/freeswitch-config-version.entity';

export interface ConfigDiff {
  added: Record<string, any>;
  modified: Record<string, { old: any; new: any }>;
  removed: Record<string, any>;
}

@Injectable()
export class FreeSwitchVersionService {
  private readonly logger = new Logger(FreeSwitchVersionService.name);

  constructor(
    @InjectRepository(FreeSwitchConfigVersion)
    private readonly versionRepository: Repository<FreeSwitchConfigVersion>,
    @InjectRepository(FreeSwitchConfigDeployment)
    private readonly deploymentRepository: Repository<FreeSwitchConfigDeployment>,
  ) {}

  async createVersion(
    configType: FreeSwitchConfigType,
    configId: string,
    configData: Record<string, any>,
    xmlContent?: string,
    changeSummary?: string,
    createdBy?: number
  ): Promise<FreeSwitchConfigVersion> {
    this.logger.log(`Creating version for ${configType}:${configId}`);

    // Deactivate current active version
    await this.versionRepository.update(
      { configType, configId, isActive: true },
      { isActive: false }
    );

    // Get next version number
    const lastVersion = await this.versionRepository.findOne({
      where: { configType, configId },
      order: { version: 'DESC' }
    });

    const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

    // Create new version
    const version = this.versionRepository.create({
      configType,
      configId,
      version: nextVersion,
      configData,
      xmlContent,
      changeSummary,
      isActive: true,
      createdBy,
    });

    const savedVersion = await this.versionRepository.save(version) as FreeSwitchConfigVersion;
    this.logger.log(`Version ${nextVersion} created for ${configType}:${configId}`);

    return savedVersion;
  }

  async getVersionHistory(
    configType: FreeSwitchConfigType,
    configId: string
  ): Promise<FreeSwitchConfigVersion[]> {
    return this.versionRepository.find({
      where: { configType, configId },
      order: { version: 'DESC' },
      relations: ['creator'],
    });
  }

  async getVersion(
    configType: FreeSwitchConfigType,
    configId: string,
    version: number
  ): Promise<FreeSwitchConfigVersion> {
    const configVersion = await this.versionRepository.findOne({
      where: { configType, configId, version },
      relations: ['creator'],
    });

    if (!configVersion) {
      throw new NotFoundException(
        `Version ${version} not found for ${configType}:${configId}`
      );
    }

    return configVersion;
  }

  async getActiveVersion(
    configType: FreeSwitchConfigType,
    configId: string
  ): Promise<FreeSwitchConfigVersion> {
    const activeVersion = await this.versionRepository.findOne({
      where: { configType, configId, isActive: true },
      relations: ['creator'],
    });

    if (!activeVersion) {
      throw new NotFoundException(
        `No active version found for ${configType}:${configId}`
      );
    }

    return activeVersion;
  }

  async rollbackToVersion(
    configType: FreeSwitchConfigType,
    configId: string,
    targetVersion: number,
    createdBy?: number
  ): Promise<FreeSwitchConfigVersion> {
    this.logger.log(`Rolling back ${configType}:${configId} to version ${targetVersion}`);

    // Get target version
    const targetVersionRecord = await this.getVersion(configType, configId, targetVersion);

    // Create new version with target version's data
    const rollbackVersion = await this.createVersion(
      configType,
      configId,
      targetVersionRecord.configData,
      targetVersionRecord.xmlContent,
      `Rolled back to version ${targetVersion}`,
      createdBy
    );

    this.logger.log(`Rollback completed for ${configType}:${configId}`);
    return rollbackVersion;
  }

  async compareVersions(
    configType: FreeSwitchConfigType,
    configId: string,
    version1: number,
    version2: number
  ): Promise<ConfigDiff> {
    const [v1, v2] = await Promise.all([
      this.getVersion(configType, configId, version1),
      this.getVersion(configType, configId, version2),
    ]);

    return this.diffConfigs(v1.configData, v2.configData);
  }

  private diffConfigs(config1: Record<string, any>, config2: Record<string, any>): ConfigDiff {
    const added: Record<string, any> = {};
    const modified: Record<string, { old: any; new: any }> = {};
    const removed: Record<string, any> = {};

    // Find added and modified keys
    for (const key in config2) {
      if (!(key in config1)) {
        added[key] = config2[key];
      } else if (JSON.stringify(config1[key]) !== JSON.stringify(config2[key])) {
        modified[key] = { old: config1[key], new: config2[key] };
      }
    }

    // Find removed keys
    for (const key in config1) {
      if (!(key in config2)) {
        removed[key] = config1[key];
      }
    }

    return { added, modified, removed };
  }

  async getVersionStats(): Promise<{
    totalVersions: number;
    byConfigType: Record<FreeSwitchConfigType, number>;
    recentVersions: FreeSwitchConfigVersion[];
  }> {
    const [totalVersions, recentVersions] = await Promise.all([
      this.versionRepository.count(),
      this.versionRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['creator'],
      }),
    ]);

    // Count by config type
    const byConfigType = {} as Record<FreeSwitchConfigType, number>;
    for (const configType of Object.values(FreeSwitchConfigType)) {
      byConfigType[configType] = await this.versionRepository.count({
        where: { configType }
      });
    }

    return {
      totalVersions,
      byConfigType,
      recentVersions,
    };
  }

  // Deployment management
  async createDeployment(
    deploymentName: string,
    configVersions: Array<{
      configType: FreeSwitchConfigType;
      configId: string;
      versionId: string;
      version: number;
    }>,
    description?: string,
    domainId?: any,
    createdBy?: number
  ): Promise<FreeSwitchConfigDeployment> {
    this.logger.log(`Creating deployment: ${deploymentName}`);

    const deployment = this.deploymentRepository.create({
      deploymentName,
      description,
      domainId,
      configVersions,
      deploymentStatus: 'pending',
      createdBy,
    });

    const savedDeployment = await this.deploymentRepository.save(deployment);
    this.logger.log(`Deployment created: ${savedDeployment.id}`);

    return savedDeployment;
  }

  async getDeployments(domainId?: any): Promise<FreeSwitchConfigDeployment[]> {
    const where = domainId ? { domainId } : {};
    
    return this.deploymentRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['creator', 'deployer'],
    });
  }

  async getDeployment(id: string): Promise<FreeSwitchConfigDeployment> {
    const deployment = await this.deploymentRepository.findOne({
      where: { id },
      relations: ['creator', 'deployer'],
    });

    if (!deployment) {
      throw new NotFoundException(`Deployment with ID ${id} not found`);
    }

    return deployment;
  }

  async markDeploymentAsDeployed(
    id: string,
    deployedBy?: number
  ): Promise<FreeSwitchConfigDeployment> {
    const deployment = await this.getDeployment(id);

    deployment.deploymentStatus = 'deployed';
    deployment.deployedAt = new Date();
    deployment.deployedBy = deployedBy;

    return this.deploymentRepository.save(deployment);
  }

  async markDeploymentAsFailed(
    id: string,
    error?: string
  ): Promise<FreeSwitchConfigDeployment> {
    const deployment = await this.getDeployment(id);

    deployment.deploymentStatus = 'failed';
    if (error) {
      deployment.rollbackData = { error };
    }

    return this.deploymentRepository.save(deployment);
  }

  async cleanupOldVersions(
    configType: FreeSwitchConfigType,
    configId: string,
    keepVersions: number = 10
  ): Promise<void> {
    this.logger.log(`Cleaning up old versions for ${configType}:${configId}, keeping ${keepVersions} versions`);

    const versions = await this.versionRepository.find({
      where: { configType, configId },
      order: { version: 'DESC' },
    });

    if (versions.length <= keepVersions) {
      return; // Nothing to clean up
    }

    const versionsToDelete = versions.slice(keepVersions);
    const versionIds = versionsToDelete.map(v => v.id);

    await this.versionRepository.delete(versionIds);
    this.logger.log(`Cleaned up ${versionsToDelete.length} old versions`);
  }
}
