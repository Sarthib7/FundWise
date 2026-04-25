#!/usr/bin/env node

/**
 * FundWise Configuration Verification Script
 * Checks environment variables required for local development.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 FundWise Configuration Verification\n');
console.log('═'.repeat(60));

const envPath = path.join(__dirname, '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1].trim()] = match[2].trim();
    }
  });
  console.log('✅ .env.local file found');
} else {
  console.log('❌ .env.local file not found!');
  process.exit(1);
}

console.log('\n📋 Required Environment Variables:\n');

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': 'Supabase Project URL',
};

const optionalVars = {
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY': 'Supabase Publishable Key',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'Supabase Legacy Anon Key',
  'NEXT_PUBLIC_SOLANA_RPC_URL': 'Solana RPC URL',
};

let allPresent = true;

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = envVars[key];
  const isPresent = value && value.length > 0;

  if (isPresent) {
    const displayValue = key.includes('KEY') || key.includes('ID')
      ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
      : value;
    console.log(`  ✅ ${description.padEnd(30)} ${displayValue}`);
  } else {
    console.log(`  ❌ ${description.padEnd(30)} MISSING`);
    allPresent = false;
  }
});

console.log('\n🔐 Supabase Client Key:\n');

const publishableKey = envVars['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const anonKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const clientKey = publishableKey || anonKey;

if (clientKey) {
  console.log(`  ✅ ${'Supabase Client Key'.padEnd(30)} ${clientKey.substring(0, 18)}...${clientKey.substring(clientKey.length - 6)}`);
} else {
  console.log(`  ❌ ${'Supabase Client Key'.padEnd(30)} MISSING`);
  allPresent = false;
}

console.log('\n🧩 Optional Environment Variables:\n');

Object.entries(optionalVars).forEach(([key, description]) => {
  if (key === 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY' || key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    return;
  }

  const value = envVars[key];
  if (value && value.length > 0) {
    console.log(`  ✅ ${description.padEnd(30)} ${value}`);
  } else {
    console.log(`  ℹ️  ${description.padEnd(30)} not set (app falls back to devnet public RPC)`);
  }
});

console.log('\n' + '═'.repeat(60));

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
if (supabaseUrl && supabaseUrl.includes('.supabase.co')) {
  console.log('✅ Supabase URL format looks correct');
} else if (supabaseUrl) {
  console.log('⚠️  Supabase URL may be incorrect');
}

const solanaRpc = envVars['NEXT_PUBLIC_SOLANA_RPC_URL'];
if (solanaRpc && !/^https?:\/\//.test(solanaRpc)) {
  console.log(`⚠️  Unexpected Solana RPC URL: ${solanaRpc}`);
}

console.log('\n' + '═'.repeat(60));

if (allPresent) {
  console.log('\n✅ All required environment variables are present!');
  console.log('\n📝 Summary:');
  console.log('   • Supabase client configured');
  console.log(`   • ${publishableKey ? 'Using publishable key' : 'Using legacy anon key'}`);
  console.log(`   • ${solanaRpc ? 'Custom Solana RPC configured' : 'Using default devnet Solana RPC'}`);
  console.log('\n🚀 Your application should run without configuration errors.');
  process.exit(0);
} else {
  console.log('\n❌ Some environment variables are missing!');
  console.log('\n📝 Please check your .env.local file and add the missing variables.');
  process.exit(1);
}
