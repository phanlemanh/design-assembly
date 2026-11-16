// Types for the reader of the ledger of screens, so a repository's own tests can read it.
export declare const SCREEN_LEDGER: string;
export declare const SCREEN_LEDGER_VERSION: number;

export interface ListedScreen {
  id: string;
  path: string;
  title: string | null;
  family: string | null;
  states: string[];
}

export interface ScreenLedger {
  version?: number | string;
  families?: Record<string, string>;
  screens: Array<Record<string, unknown>>;
}

export declare function readScreenLedger(text: string | null | undefined): ScreenLedger | null;
export declare function builtScreens(ledger: ScreenLedger | null): ListedScreen[];

// One file per screen: the text of the ledger among files given by path, in whichever shape they
// hold, or null when there is none.
export declare const FRAGMENTS_SHARED: string;
export declare const FRAGMENTS_MARKER: string;
export declare function fragmentsFolder(file: string): string;
export declare function isFragment(name: string): boolean;
export declare function ledgerOfFiles(files: Record<string, string>, file?: string): string | null;
export declare function joinLedger(
  shared: string,
  fragments: Array<{ name: string; text: string }>,
): string;
export declare function splitLedger(text: string): {
  shared: string;
  fragments: Array<{ id: string; name: string; text: string }>;
  problems: string[];
};
export declare function lostEntries(before: string, after: string): string[];
