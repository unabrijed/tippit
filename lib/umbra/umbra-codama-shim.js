// Re-export everything from the installed @umbra-privacy/umbra-codama using a
// relative filesystem path so webpack does NOT apply the alias back to this
// shim (which would create a circular dependency).
//
// Only the 4 network-balance-with-encrypted-address PDA finders are truly
// absent from umbra-codama@3.0.0-rc.0. All other symbols needed by
// @umbra-privacy/sdk@5.0.0-rc.0 exist in the installed version and are
// covered by the export * below.

export * from "../../node_modules/@umbra-privacy/umbra-codama/dist/index.js";

function notImplemented(name) {
  return function stub() {
    throw new Error(
      `[umbra-codama-shim] '${name}' is not available in the installed umbra-codama. This stub should never be called at runtime by ghostpay.`
    );
  };
}

export const findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16StealthPoolDepositWithEncryptedAddressInputBufferPda = notImplemented("findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16StealthPoolDepositWithEncryptedAddressInputBufferPda");
export const findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16ComputationDataPda = notImplemented("findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16ComputationDataPda");
export const findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16FeeVaultPda = notImplemented("findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16FeeVaultPda");
export const findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16ZeroKnowledgeVerifyingKeyPda = notImplemented("findDepositIntoStealthPoolFromNetworkBalanceWithEncryptedAddressV16ZeroKnowledgeVerifyingKeyPda");
