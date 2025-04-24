/**
 * Represents a specialization in the game.
 * 
 * @class
 * @classdesc This class encapsulates the properties of a specialization.
 * @param {number} id - The specialization's ID.
 * @param {string} name - The name of the specialization.
 * @param {string} profession - The profession that this specialization belongs to.
 * @param {boolean} elite - Indicates whether this specialization is an Elite specialization.
 * @param {string} icon - A URL to an icon of the specialization.
 * @param {string} background - A URL to the background image of the specialization.
 * @param {number[]} minorTraits - An array of IDs specifying the minor traits in the specialization.
 * @param {number[]} majorTraits - An array of IDs specifying the major traits in the specialization.
 */
export class Specialization {

    constructor(id, name, profession, elite, icon, background, minorTraits, majorTraits) {
      this.id = id;
      this.name = name;
      this.profession = profession;
      this.elite = elite;
      this.icon = icon;
      this.background = background;
      this.minorTraits = minorTraits;
      this.majorTraits = majorTraits;
    }

    static parse(data) {
        const id = data.id;
        const name = data.name;
        const profession = data.profession;
        const elite = data.elite;
        const icon = data.icon;
        const background = data.background;
        const minorTraits = data.minor_traits || [];
        const majorTraits = data.major_traits || [];
        return new Specialization(id, name, profession, elite, icon, background, minorTraits, majorTraits);
      }
  }