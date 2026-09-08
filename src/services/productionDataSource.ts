/**
 * The single production data source Mission Control talks to. Today it's
 * the manual Excel snapshot; swapping in a live sync later — once
 * ICT/security can safely connect SharePoint — means changing only this
 * one line to an ApiProductionDataSource implementing the same
 * ProductionDataSource interface. Never give this layer Microsoft
 * credentials, SharePoint secrets or access tokens directly: those belong
 * behind the future Power Automate / API layer, not in this public bundle.
 */
import { ManualProductionDataSource } from '../data/production/manualMarreSnapshot';
import type { ProductionDataSource } from '../types/production';

export const productionDataSource: ProductionDataSource = new ManualProductionDataSource();
