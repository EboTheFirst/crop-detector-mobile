// scripts/validateMapping.ts
// Script to validate that our disease mapping is correct with the backend

import { validateMappings, DISEASE_MAPPINGS } from '../utils/diseaseMapping';
import { readableLabels } from '../constants/labels';

/**
 * Validate that our mapping covers all model labels
 */
function validateModelCoverage(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const mappedLabels = new Set(DISEASE_MAPPINGS.map(m => m.localLabel));
  
  readableLabels.forEach(label => {
    if (!mappedLabels.has(label)) {
      errors.push(`Missing mapping for model label: ${label}`);
    }
  });
  
  DISEASE_MAPPINGS.forEach(mapping => {
    if (!readableLabels.includes(mapping.localLabel)) {
      errors.push(`Mapping exists for non-existent model label: ${mapping.localLabel}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check backend disease names against expected format
 */
function validateBackendFormat(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Expected backend diseases based on the backend code
  const expectedBackendDiseases = [
    // Cashew
    'anthracnose', 'gumosis', 'leaf_miner', 'red_rust', 'healthy',
    // Cassava  
    'bacterial_blight', 'brown_spot', 'green_mite', 'mosaic', 'healthy',
    // Maize
    'fall_armyworm', 'grasshopper', 'leaf_beetle', 'leaf_blight', 'leaf_spot', 'streak_virus', 'healthy',
    // Tomato
    'leaf_blight', 'leaf_curl', 'septoria_leaf_spot', 'verticillium_wilt', 'healthy'
  ];
  
  const mappedBackendNames = new Set(DISEASE_MAPPINGS.map(m => m.backendDiseaseName));
  
  // Check if we have mappings for expected diseases
  expectedBackendDiseases.forEach(disease => {
    if (!mappedBackendNames.has(disease)) {
      errors.push(`Missing mapping for expected backend disease: ${disease}`);
    }
  });
  
  // Check for unexpected backend names
  DISEASE_MAPPINGS.forEach(mapping => {
    if (!expectedBackendDiseases.includes(mapping.backendDiseaseName)) {
      errors.push(`Unexpected backend disease name: ${mapping.backendDiseaseName}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generate mapping summary for documentation
 */
function generateMappingSummary(): string {
  const summary = ['# Disease Mapping Summary\n'];
  
  const cropGroups = DISEASE_MAPPINGS.reduce((groups, mapping) => {
    const crop = mapping.cropType;
    if (!groups[crop]) groups[crop] = [];
    groups[crop].push(mapping);
    return groups;
  }, {} as Record<string, typeof DISEASE_MAPPINGS>);
  
  Object.entries(cropGroups).forEach(([crop, mappings]) => {
    summary.push(`## ${crop.toUpperCase()}\n`);
    mappings.forEach(mapping => {
      const status = mapping.isHealthy ? '✅ Healthy' : '🦠 Disease';
      summary.push(`- **${mapping.localLabel}** → \`${mapping.backendDiseaseName}\` ${status}`);
    });
    summary.push('');
  });
  
  return summary.join('\n');
}

/**
 * Main validation function
 */
export function runValidation(): void {
  console.log('🔍 Validating Disease Mapping...\n');
  
  // Validate internal mapping consistency
  const mappingValidation = validateMappings();
  if (!mappingValidation.valid) {
    console.error('❌ Mapping validation failed:');
    mappingValidation.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Internal mapping validation passed');
  }
  
  // Validate model coverage
  const coverageValidation = validateModelCoverage();
  if (!coverageValidation.valid) {
    console.error('❌ Model coverage validation failed:');
    coverageValidation.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Model coverage validation passed');
  }
  
  // Validate backend format
  const backendValidation = validateBackendFormat();
  if (!backendValidation.valid) {
    console.error('❌ Backend format validation failed:');
    backendValidation.errors.forEach(error => console.error(`  - ${error}`));
  } else {
    console.log('✅ Backend format validation passed');
  }
  
  // Summary
  const totalMappings = DISEASE_MAPPINGS.length;
  const healthyMappings = DISEASE_MAPPINGS.filter(m => m.isHealthy).length;
  const diseaseMappings = totalMappings - healthyMappings;
  
  console.log('\n📊 Mapping Statistics:');
  console.log(`  - Total mappings: ${totalMappings}`);
  console.log(`  - Disease mappings: ${diseaseMappings}`);
  console.log(`  - Healthy mappings: ${healthyMappings}`);
  console.log(`  - Supported crops: ${new Set(DISEASE_MAPPINGS.map(m => m.cropType)).size}`);
  
  // Generate documentation
  const summary = generateMappingSummary();
  console.log('\n📝 Mapping Summary:');
  console.log(summary);
  
  const allValid = mappingValidation.valid && coverageValidation.valid && backendValidation.valid;
  console.log(allValid ? '\n🎉 All validations passed!' : '\n❌ Some validations failed!');
}

// Run validation if this script is executed directly
if (require.main === module) {
  runValidation();
}

/**
 * Test specific mapping functions
 */
export function testMappingFunctions(): void {
  console.log('🧪 Testing mapping functions...\n');
  
  // Test some examples
  const testCases = [
    'Cashew - Anthracnose',
    'Cassava - Healthy', 
    'Maize - Fall Armyworm',
    'Tomato - Leaf Curl'
  ];
  
  testCases.forEach(testCase => {
    const mapping = require('../utils/diseaseMapping').mapLocalToBackend(testCase);
    if (mapping) {
      console.log(`✅ ${testCase} → ${mapping.backendDiseaseName} (${mapping.cropType})`);
    } else {
      console.log(`❌ ${testCase} → No mapping found`);
    }
  });
}
