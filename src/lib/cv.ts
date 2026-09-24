import { getEntry, type CollectionEntry } from 'astro:content';

export type Cv = CollectionEntry<'cv'>['data'];
export type CvBasics = Cv['basics'];
export type CvLocation = CvBasics['location'];
export type CvProfile = NonNullable<CvBasics['profiles']>[number];
export type CvWork = Cv['work'][number];
export type CvVolunteer = NonNullable<Cv['volunteer']>[number];
export type CvEducation = Cv['education'][number];
export type CvAward = NonNullable<Cv['awards']>[number];
export type CvCertificate = NonNullable<Cv['certificates']>[number];
export type CvSkillGroup = NonNullable<Cv['skills']>[number];
export type CvTechnologyGroup = NonNullable<Cv['technologies']>[number];
export type CvLanguage = NonNullable<Cv['languages']>[number];
export type CvInterest = NonNullable<Cv['interests']>[number];

// The one sanctioned throw (spec 0002): a JSON syntax error is only logged by
// Astro's file loader, so a missing entry must fail the build here.
export const getCv = async (): Promise<Cv> => {
  const entry = await getEntry('cv', 'main');
  if (entry === undefined) {
    throw new Error(
      'src/content/cv.json is missing or unparsable; see the file loader error above',
    );
  }
  return entry.data;
};
