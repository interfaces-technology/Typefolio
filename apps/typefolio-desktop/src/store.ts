import Store from "electron-store";

interface StoreSchema {
  token: string;
  email: string;
  libraryId: string;
  installedFontIds: string[];
  manifestEtag: string;
}

export const store = new Store<StoreSchema>({
  name: "typefolio",
  defaults: {
    token: "",
    email: "",
    libraryId: "",
    installedFontIds: [],
    manifestEtag: "",
  },
});
