/* @flow */

import LedgerWallet from './class';
import { ledgerConnection, handleLedgerConnectionError } from './helpers';

import { derivationPathSerializer, userInputValidator } from '../core/helpers';
import { staticMethods as messages } from './messages';

import { PATH, NETWORK_IDS } from '../core/defaults';

import type { LedgerInstanceType } from './flowtypes';
import type { WalletArgumentsType } from '../core/flowtypes';

const ledgerWallet: Object = Object.assign(
  {},
  {
    /**
     * Open a new wallet from the public key and chain code, which are received
     * form the Ledger device (after unlocking it and entering the ethereum app)
     *
     * @method open
     *
     * @param {number} addressCount the number of extra addresses to generate from the derivation path
     * @param {number} chainId The id of the network to use, defaults to mainnet (1)
     *
     * The above param is sent in as a prop of an {WalletArgumentsType} object.
     *
     * @return {WalletType} The wallet object resulted by instantiating the class
     * (Object is wrapped in a promise).
     *
     */
    open: async (
      argumentObject: WalletArgumentsType = {},
    ): Promise<LedgerWallet | void> => {
      /*
       * Validate the trasaction's object input
       */
      userInputValidator({
        firstArgument: argumentObject,
      });
      const { addressCount, chainId = NETWORK_IDS.HOMESTEAD } = argumentObject;
      /*
       * @TODO Reduce code repetition
       * By moving this inside a helper. This same patter will be used on the
       * trezor wallet as well.
       *
       * If we're on a testnet set the coin type id to `1`
       * This will be used in the derivation path
       */
      const coinType: number =
        chainId === NETWORK_IDS.HOMESTEAD
          ? PATH.COIN_MAINNET
          : PATH.COIN_TESTNET;
      /*
       * Get to root derivation path based on the coin type.
       *
       * Based on this, we will then derive all the needed address indexes
       * (inside the class constructor)
       */
      const rootDerivationPath: string = derivationPathSerializer({
        coinType,
      });
      try {
        const ledger: LedgerInstanceType = await ledgerConnection();
        /*
         * Get the harware wallet's root public key and chain code, to use
         * for deriving the rest of the accounts
         */
        const { publicKey, chainCode } = await ledger.getAddress(
          /*
           * @NOTE Ledger requires a derivation path containing only the account value
           * No change and index
           *
           * If you want to prompt the user on the device, set the second argument
           * as true.
           */
          rootDerivationPath,
          false,
          true,
        );
        const walletInstance: LedgerWallet = new LedgerWallet({
          publicKey,
          chainCode,
          /*
           * Since we need to strip out the change values when opening the Ledger
           * wallet, we need to remove the post-pending slash. This way, the final
           * derivation path gets concatenated correctly.
           *
           * The only alternative would be to re-generate the derivation path inside
           * the class's constructor, but that would mean extra computational resources.
           */
          rootDerivationPath,
          addressCount,
          chainId,
        });
        return walletInstance;
      } catch (caughtError) {
        return handleLedgerConnectionError(
          caughtError,
          `${messages.userExportGenericError}: ${rootDerivationPath} ${
            caughtError.message
          }`,
        );
      }
    },
  },
);

export default ledgerWallet;
