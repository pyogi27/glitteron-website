import assert from 'node:assert/strict'
import { formatRupees } from './format.ts'

assert.equal(formatRupees(8680), '₹8,680')
assert.equal(formatRupees(1562.4), '₹1,562.40')
assert.equal(formatRupees(10242.4), '₹10,242.40')
assert.equal(formatRupees('762.71'), '₹762.71')
assert.equal(formatRupees(169.5), '₹169.50')
assert.equal(formatRupees(0.004), '₹0')
assert.equal(formatRupees('abc'), '₹—')
console.log('format ok')
