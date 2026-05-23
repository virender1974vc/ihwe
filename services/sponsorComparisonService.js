const SponsorComparison = require('../models/SponsorComparison');

/**
 * Service to handle SponsorComparison operations.
 */
class SponsorComparisonService {
    /**
     * Get dynamic content, seeds defaults if empty.
     */
    async getContent() {
        let content = await SponsorComparison.findOne();
        if (!content) {
            const defaultCards = [
                {
                    title: "TITLE SPONSOR",
                    desc: "Maximum visibility & brand exclusivity",
                    image: "/images/partnership/trophy.png",
                    color: "blue",
                },
                {
                    title: "POWERED BY SPONSOR",
                    desc: "Align your brand as the power behind IHWE",
                    image: "/images/partnership/saver.png",
                    color: "green",
                },
                {
                    title: "ASSOCIATE SPONSOR",
                    desc: "High-impact visibility & brand recognition",
                    image: "/images/partnership/associate.png",
                    color: "blue",
                },
                {
                    title: "CONFERENCE SPONSOR",
                    desc: "Brand association with knowledge sessions",
                    image: "/images/partnership/speaker.png",
                    color: "green",
                },
                {
                    title: "REGISTRATION SPONSOR",
                    desc: "High brand recall at every entry point",
                    image: "/images/partnership/reg.png",
                    color: "blue",
                },
                {
                    title: "LANYARD / BADGE SPONSOR",
                    desc: "Put your brand around every neck",
                    image: "/images/partnership/lanyard.png",
                    color: "green",
                },
                {
                    title: "WELLNESS ZONE SPONSOR",
                    desc: "Showcase your brand in the wellness experience zone",
                    image: "/images/partnership/wellness.png",
                    color: "blue",
                },
                {
                    title: "DIGITAL PROMOTION PARTNER",
                    desc: "Expand your reach across digital platforms",
                    image: "/images/partnership/digital.png",
                    color: "green",
                },
            ];

            const defaultComparison = [
                {
                    benefit: "Logo on all event branding",
                    values: ["✔", "✔", "✔", "✔", "✔", "✔", "✔", "✔"],
                },
                {
                    benefit: "Keynote / Speaking Opportunity",
                    values: ["30 mins", "20 mins", "—", "—", "—", "—", "—", "—"],
                },
                {
                    benefit: "Exhibition Space",
                    values: ["12 sqm", "9 sqm", "6 sqm", "—", "—", "—", "2 sqm", "—"],
                },
                {
                    benefit: "Ad in Souvenir",
                    values: ["Full Page", "Half Page", "Half Page", "Listing", "Listing", "Listing", "Listing", "—"],
                },
                {
                    benefit: "Press Release Mentions",
                    values: ["All", "Featured", "Featured", "—", "—", "—", "—", "—"],
                },
                {
                    benefit: "Complimentary Delegate Passes",
                    values: ["12", "8", "6", "4", "4", "2", "2", "—"],
                },
                {
                    benefit: "VIP Lounge Access",
                    values: ["✔", "✔", "✔", "✔", "✔", "✔", "✔", "—"],
                },
            ];

            content = await SponsorComparison.create({
                cards: defaultCards,
                comparisonData: defaultComparison
            });
        }
        return content;
    }

    /**
     * Save/Update SponsorComparison configuration.
     */
    async saveContent(data) {
        return await SponsorComparison.findOneAndUpdate(
            {},
            { 
                cards: data.cards,
                comparisonData: data.comparisonData,
                lastUpdated: Date.now() 
            },
            { upsert: true, new: true }
        );
    }
}

module.exports = new SponsorComparisonService();
