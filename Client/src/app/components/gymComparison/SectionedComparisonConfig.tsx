import { useState } from 'react';
import { Paper, Box, Typography, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Grid } from '@mui/material';
import StatWeightsSection from './StatWeightsSection';
import EnergySourcesSection from './EnergySourcesSection';
import HappyPerksSection from './HappyPerksSection';
import BenefitsEventsSection from './BenefitsEventsSection';
import StatJumpsSection from './StatJumpsSection';
import { getCompanyBenefit, getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio } from '../../../lib/utils/gymHelpers';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import { exportIndividualComparisonData, type IndividualComparisonExportData } from '../../../lib/utils/exportHelpers';

// Training section interface - matches the one in GymComparison.tsx
interface TrainingSection {
  id: string;
  startDay: number;
  endDay: number;
  statWeights: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  maxEnergy: number;
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  edvdJumpEnabled: boolean;
  edvdJumpFrequency: number;
  edvdJumpDvds: number;
  edvdJumpLimit: 'indefinite' | 'count' | 'stat';
  edvdJumpCount: number;
  edvdJumpStatTarget: number;
  edvdJumpAdultNovelties: boolean;
  candyJumpEnabled: boolean;
  candyJumpItemId: number;
  candyJumpUseEcstasy: boolean;
  candyJumpQuantity: number;
  candyJumpFactionBenefit: number;
  energyJumpEnabled: boolean;
  energyJumpItemId: number;
  energyJumpQuantity: number;
  energyJumpFactionBenefit: number;
  lossReviveEnabled: boolean;
  lossReviveNumberPerDay: number;
  lossReviveEnergyCost: number;
  lossReviveDaysBetween: number;
  lossRevivePricePerLoss: number;
  diabetesDayEnabled: boolean;
  diabetesDayNumberOfJumps: 1 | 2;
  diabetesDayFHC: 0 | 1 | 2;
  diabetesDayGreenEgg: 0 | 1 | 2;
  diabetesDaySeasonalMail: boolean;
  diabetesDayLogoClick: boolean;
  companyBenefitKey: string;
  candleShopStars: number;
  happy: number;
  daysSkippedPerMonth: number;
  statDriftPercent: number;
  balanceAfterGymIndex: number;
  ignorePerksForGymSelection: boolean;
  islandCostPerDay?: number;
}

interface ComparisonState {
  id: string;
  name: string;
  sections: TrainingSection[];
  showIndividualStats: boolean;
}

interface SectionedComparisonConfigProps {
  activeState: ComparisonState;
  updateState: (stateId: string, updates: Partial<ComparisonState>) => void;
  handleRemoveState: (stateId: string) => void;
  handleCopyState: (stateId: string) => void;
  canRemoveState: boolean;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  result?: SimulationResult;
  initialStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  months: number;
}

export default function SectionedComparisonConfig({
  activeState,
  updateState,
  handleRemoveState,
  handleCopyState,
  canRemoveState,
  showCosts,
  itemPricesData,
  result,
  initialStats,
  months
}: SectionedComparisonConfigProps) {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>(activeState.sections[0]?.id || null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  const [deleteOption, setDeleteOption] = useState<'left' | 'right' | null>(null);
  
  const totalDays = months * 30;
  
  const handleDownload = () => {
    if (!result) return;
    
    const statGains = {
      strength: result.finalStats.strength - initialStats.strength,
      speed: result.finalStats.speed - initialStats.speed,
      defense: result.finalStats.defense - initialStats.defense,
      dexterity: result.finalStats.dexterity - initialStats.dexterity,
    };
    
    const costs = (showCosts && itemPricesData) ? {
      edvd: result.edvdJumpCosts?.totalCost || 0,
      xanax: result.xanaxCosts?.totalCost || 0,
      points: result.pointsRefillCosts?.totalCost || 0,
      candy: result.candyJumpCosts?.totalCost || 0,
      energy: result.energyJumpCosts?.totalCost || 0,
      lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
      island: result.islandCosts?.totalCost || 0,
      total: (result.edvdJumpCosts?.totalCost || 0) + 
             (result.xanaxCosts?.totalCost || 0) + 
             (result.pointsRefillCosts?.totalCost || 0) + 
             (result.candyJumpCosts?.totalCost || 0) + 
             (result.energyJumpCosts?.totalCost || 0) + 
             (result.islandCosts?.totalCost || 0) - 
             (result.lossReviveIncome?.totalIncome || 0),
    } : undefined;
    
    const exportData: IndividualComparisonExportData = {
      name: activeState.name,
      finalStats: result.finalStats,
      statGains,
      initialStats,
      months,
      dailySnapshots: result.dailySnapshots,
      costs,
    };
    
    exportIndividualComparisonData(exportData);
  };
  
  const handleViewTrainingRegime = () => {
    if (!result) return;
    
    const statGains = {
      strength: result.finalStats.strength - initialStats.strength,
      speed: result.finalStats.speed - initialStats.speed,
      defense: result.finalStats.defense - initialStats.defense,
      dexterity: result.finalStats.dexterity - initialStats.dexterity,
    };
    
    const costs = (showCosts && itemPricesData) ? {
      edvd: result.edvdJumpCosts?.totalCost || 0,
      xanax: result.xanaxCosts?.totalCost || 0,
      points: result.pointsRefillCosts?.totalCost || 0,
      candy: result.candyJumpCosts?.totalCost || 0,
      energy: result.energyJumpCosts?.totalCost || 0,
      lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
      island: result.islandCosts?.totalCost || 0,
      total: (result.edvdJumpCosts?.totalCost || 0) + 
             (result.xanaxCosts?.totalCost || 0) + 
             (result.pointsRefillCosts?.totalCost || 0) + 
             (result.candyJumpCosts?.totalCost || 0) + 
             (result.energyJumpCosts?.totalCost || 0) + 
             (result.islandCosts?.totalCost || 0) - 
             (result.lossReviveIncome?.totalIncome || 0),
    } : undefined;
    
    const exportData: IndividualComparisonExportData = {
      name: activeState.name,
      finalStats: result.finalStats,
      statGains,
      initialStats,
      months,
      dailySnapshots: result.dailySnapshots,
      costs,
    };
    
    localStorage.setItem('trainingBreakdown_data', JSON.stringify(exportData));
    
    const existingStartDate = localStorage.getItem('trainingBreakdown_startDate');
    if (!existingStartDate) {
      localStorage.setItem('trainingBreakdown_startDate', new Date().toISOString().split('T')[0]);
    }
    
    navigate('/trainingBreakdown');
  };
  
  const handleAddSection = () => {
    const lastSection = activeState.sections[activeState.sections.length - 1];
    
    // Calculate where to split the last section
    // If the last section is more than 30 days, split it roughly in half
    // Otherwise, split it with at least 1 day remaining in the last section
    const lastSectionDays = lastSection.endDay - lastSection.startDay + 1;
    
    if (lastSectionDays < 2) {
      return; // Can't split a 1-day section
    }
    
    // Split point: aim for roughly equal sections, but ensure at least 1 day in each
    const splitPoint = Math.floor((lastSection.startDay + lastSection.endDay) / 2);
    
    // Adjust the last section to end at the split point
    const updatedLastSection = {
      ...lastSection,
      endDay: splitPoint,
    };
    
    // Create new section from split point + 1 to the original end
    const newSection: TrainingSection = {
      ...lastSection,
      id: Date.now().toString(),
      startDay: splitPoint + 1,
      endDay: lastSection.endDay,
    };
    
    // Update sections array
    const updatedSections = [
      ...activeState.sections.slice(0, -1),
      updatedLastSection,
      newSection,
    ];
    
    updateState(activeState.id, { sections: updatedSections });
    setExpandedSection(newSection.id);
  };
  
  const handleDeleteSection = (sectionId: string) => {
    if (activeState.sections.length === 1) {
      return; // Can't delete the only section
    }
    
    const sectionIndex = activeState.sections.findIndex(s => s.id === sectionId);
    const section = activeState.sections[sectionIndex];
    
    // Auto-expand for first or last section
    if (sectionIndex === 0) {
      // First section: expand next section backward
      const updatedSections = activeState.sections.filter(s => s.id !== sectionId);
      updatedSections[0].startDay = section.startDay;
      updateState(activeState.id, { sections: updatedSections });
      return;
    }
    
    if (sectionIndex === activeState.sections.length - 1) {
      // Last section: expand previous section forward
      const updatedSections = activeState.sections.filter(s => s.id !== sectionId);
      updatedSections[updatedSections.length - 1].endDay = section.endDay;
      updateState(activeState.id, { sections: updatedSections });
      return;
    }
    
    // Middle section: show modal
    setSectionToDelete(sectionId);
    setDeleteModalOpen(true);
  };
  
  const handleDeleteModalConfirm = () => {
    if (!sectionToDelete || !deleteOption) return;
    
    const sectionIndex = activeState.sections.findIndex(s => s.id === sectionToDelete);
    const section = activeState.sections[sectionIndex];
    const updatedSections = [...activeState.sections];
    
    if (deleteOption === 'left') {
      // Expand left section forward
      updatedSections[sectionIndex - 1].endDay = section.endDay;
    } else {
      // Expand right section backward
      updatedSections[sectionIndex + 1].startDay = section.startDay;
    }
    
    const finalSections = updatedSections.filter(s => s.id !== sectionToDelete);
    updateState(activeState.id, { sections: finalSections });
    
    setDeleteModalOpen(false);
    setSectionToDelete(null);
    setDeleteOption(null);
  };
  
  const updateSection = (sectionId: string, updates: Partial<TrainingSection>) => {
    const updatedSections = activeState.sections.map(section =>
      section.id === sectionId ? { ...section, ...updates } : section
    );
    updateState(activeState.id, { sections: updatedSections });
  };
  
  // Validate section date changes and automatically adjust adjacent sections
  const validateAndUpdateSectionDates = (sectionId: string, field: 'startDay' | 'endDay', value: number) => {
    const sectionIndex = activeState.sections.findIndex(s => s.id === sectionId);
    const section = activeState.sections[sectionIndex];
    
    // Validate value is within total days range
    if (value < 1 || value > totalDays) {
      return; // Invalid: out of bounds
    }
    
    if (field === 'startDay') {
      // Validate: startDay must be less than current section's endDay
      if (value >= section.endDay) {
        return; // Invalid: would make section have 0 or negative days
      }
      
      // Validate: if there's a previous section, ensure we're not going before day 1
      if (sectionIndex > 0 && value < 1) {
        return; // Invalid: can't start before day 1
      }
      
      // Update this section's startDay AND the previous section's endDay
      const updatedSections = activeState.sections.map((s, idx) => {
        if (s.id === sectionId) {
          return { ...s, startDay: value };
        }
        // Adjust previous section's endDay to be value - 1
        if (idx === sectionIndex - 1) {
          return { ...s, endDay: value - 1 };
        }
        return s;
      });
      
      updateState(activeState.id, { sections: updatedSections });
    } else {
      // field === 'endDay'
      // Validate: endDay must be greater than current section's startDay
      if (value <= section.startDay) {
        return; // Invalid: would make section have 0 or negative days
      }
      
      // Validate: if there's a next section, ensure we don't exceed totalDays
      if (sectionIndex < activeState.sections.length - 1 && value >= totalDays) {
        return; // Invalid: can't extend beyond total days
      }
      
      // Update this section's endDay AND the next section's startDay
      const updatedSections = activeState.sections.map((s, idx) => {
        if (s.id === sectionId) {
          return { ...s, endDay: value };
        }
        // Adjust next section's startDay to be value + 1
        if (idx === sectionIndex + 1) {
          return { ...s, startDay: value + 1 };
        }
        return s;
      });
      
      updateState(activeState.id, { sections: updatedSections });
    }
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <TextField 
          label="Comparison Name" 
          value={activeState.name} 
          onChange={(e) => updateState(activeState.id, { name: e.target.value })} 
          size="small"
          sx={{ width: 250 }}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={handleViewTrainingRegime}
            disabled={!result}
          >
            View
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!result}
          >
            Download
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon />}
            onClick={() => handleCopyState(activeState.id)}
          >
            Copy
          </Button>
          {canRemoveState && (
            <IconButton color="error" onClick={() => handleRemoveState(activeState.id)} size="small">
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Sections */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle2">Training Sections</Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddSection}
            disabled={activeState.sections[activeState.sections.length - 1]?.endDay - activeState.sections[activeState.sections.length - 1]?.startDay < 1}
          >
            Add Section
          </Button>
        </Box>
        
        {activeState.sections.map((section, index) => (
          <Accordion
            key={section.id}
            expanded={expandedSection === section.id}
            onChange={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                <Typography>
                  Section {index + 1}: Days {section.startDay}-{section.endDay}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(section.id);
                  }}
                  disabled={activeState.sections.length === 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Date Range */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                  label="Start Day"
                  type="number"
                  value={section.startDay}
                  onChange={(e) => validateAndUpdateSectionDates(section.id, 'startDay', parseInt(e.target.value) || 1)}
                  size="small"
                  inputProps={{ min: 1, max: totalDays }}
                  disabled={index === 0} // Can't change start day of first section
                />
                <TextField
                  label="End Day"
                  type="number"
                  value={section.endDay}
                  onChange={(e) => validateAndUpdateSectionDates(section.id, 'endDay', parseInt(e.target.value) || 1)}
                  size="small"
                  inputProps={{ min: 1, max: totalDays }}
                  disabled={index === activeState.sections.length - 1} // Can't change end day of last section
                />
              </Box>
              
              {/* Training Settings */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <StatWeightsSection
                    statWeights={section.statWeights}
                    onUpdate={(updates) => {
                      if ('strength' in updates || 'speed' in updates || 'defense' in updates || 'dexterity' in updates) {
                        updateSection(section.id, { statWeights: { ...section.statWeights, ...updates } });
                      }
                    }}
                    getHanksRatio={getHanksRatio}
                    getBaldrsRatio={getBaldrsRatio}
                    getDefensiveBuildRatio={getDefensiveBuildRatio}
                    statDriftPercent={section.statDriftPercent}
                    onDriftUpdate={(percent) => updateSection(section.id, { statDriftPercent: percent })}
                    balanceAfterGymIndex={section.balanceAfterGymIndex}
                    onBalanceAfterGymIndexUpdate={(gymIndex) => updateSection(section.id, { balanceAfterGymIndex: gymIndex })}
                    ignorePerksForGymSelection={section.ignorePerksForGymSelection}
                    onIgnorePerksForGymSelectionUpdate={(ignore) => updateSection(section.id, { ignorePerksForGymSelection: ignore })}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <EnergySourcesSection
                    maxEnergy={section.maxEnergy}
                    hoursPlayedPerDay={section.hoursPlayedPerDay}
                    xanaxPerDay={section.xanaxPerDay}
                    hasPointsRefill={section.hasPointsRefill}
                    daysSkippedPerMonth={section.daysSkippedPerMonth}
                    companyBenefit={getCompanyBenefit(section.companyBenefitKey, section.candleShopStars)}
                    showCosts={showCosts}
                    itemPricesData={itemPricesData}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <HappyPerksSection
                    happy={section.happy}
                    perkPercs={section.perkPercs}
                    showCosts={showCosts}
                    islandCostPerDay={section.islandCostPerDay}
                    onUpdate={(updates) => {
                      if ('happy' in updates) {
                        updateSection(section.id, { happy: updates.happy });
                      }
                      if ('perkPercs' in updates) {
                        updateSection(section.id, { perkPercs: { ...section.perkPercs, ...updates.perkPercs } });
                      }
                      if ('islandCostPerDay' in updates) {
                        updateSection(section.id, { islandCostPerDay: updates.islandCostPerDay });
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <BenefitsEventsSection
                    companyBenefitKey={section.companyBenefitKey}
                    candleShopStars={section.candleShopStars}
                    diabetesDayEnabled={section.diabetesDayEnabled}
                    diabetesDayNumberOfJumps={section.diabetesDayNumberOfJumps}
                    diabetesDayFHC={section.diabetesDayFHC}
                    diabetesDayGreenEgg={section.diabetesDayGreenEgg}
                    diabetesDaySeasonalMail={section.diabetesDaySeasonalMail}
                    diabetesDayLogoClick={section.diabetesDayLogoClick}
                    onUpdate={(updates) => updateSection(section.id, updates)}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>Stat Jumps</Typography>
              <StatJumpsSection
                edvdJumpEnabled={section.edvdJumpEnabled}
                edvdJumpFrequency={section.edvdJumpFrequency}
                edvdJumpDvds={section.edvdJumpDvds}
                edvdJumpLimit={section.edvdJumpLimit}
                edvdJumpCount={section.edvdJumpCount}
                edvdJumpStatTarget={section.edvdJumpStatTarget}
                edvdJumpAdultNovelties={section.edvdJumpAdultNovelties}
                candyJumpEnabled={section.candyJumpEnabled}
                candyJumpItemId={section.candyJumpItemId}
                candyJumpUseEcstasy={section.candyJumpUseEcstasy}
                candyJumpQuantity={section.candyJumpQuantity}
                candyJumpFactionBenefit={section.candyJumpFactionBenefit}
                energyJumpEnabled={section.energyJumpEnabled}
                energyJumpItemId={section.energyJumpItemId}
                energyJumpQuantity={section.energyJumpQuantity}
                energyJumpFactionBenefit={section.energyJumpFactionBenefit}
                lossReviveEnabled={section.lossReviveEnabled}
                lossReviveNumberPerDay={section.lossReviveNumberPerDay}
                lossReviveEnergyCost={section.lossReviveEnergyCost}
                lossReviveDaysBetween={section.lossReviveDaysBetween}
                lossRevivePricePerLoss={section.lossRevivePricePerLoss}
                hasPointsRefill={section.hasPointsRefill}
                xanaxPerDay={section.xanaxPerDay}
                maxEnergy={section.maxEnergy}
                showCosts={showCosts}
                itemPricesData={itemPricesData}
                onUpdate={(updates) => updateSection(section.id, updates)}
              />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
      
      {/* Delete Section Modal */}
      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <DialogTitle>Delete Section</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Deleting this section will leave a gap. How should the gap be handled?
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button
              variant={deleteOption === 'left' ? 'contained' : 'outlined'}
              onClick={() => setDeleteOption('left')}
              fullWidth
              sx={{ mb: 1 }}
            >
              Expand left section forward
            </Button>
            <Button
              variant={deleteOption === 'right' ? 'contained' : 'outlined'}
              onClick={() => setDeleteOption('right')}
              fullWidth
            >
              Expand right section backward
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteModalConfirm} disabled={!deleteOption} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
