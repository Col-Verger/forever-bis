// statdump prints the character stats the simulator computes for one settings
// file (the same IndividualSimSettings this repo writes to runs/<id>.settings.json).
// It uses the sim's own ComputeStats, so the numbers already include gear,
// enchants, talents, buffs and consumables — nothing is estimated here.
//
// Usage: statdump -in runs/mage-fire-max.settings.json [-out runs/mage-fire-max.stats.json]
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"sort"

	"github.com/wowsims/forever/sim"
	"github.com/wowsims/forever/sim/core"
	simproto "github.com/wowsims/forever/sim/core/proto"
	"google.golang.org/protobuf/encoding/protojson"
)

func init() {
	// Registers every spec's agent factory; without it NewEnvironment panics.
	sim.RegisterAll()
}

func fail(err error) {
	fmt.Fprintln(os.Stderr, "statdump:", err)
	os.Exit(1)
}

func main() {
	in := flag.String("in", "", "IndividualSimSettings JSON file")
	out := flag.String("out", "", "write the JSON here instead of stdout")
	flag.Parse()
	if *in == "" {
		fail(fmt.Errorf("-in is required"))
	}

	raw, err := os.ReadFile(*in)
	if err != nil {
		fail(err)
	}
	settings := &simproto.IndividualSimSettings{}
	if err := (protojson.UnmarshalOptions{DiscardUnknown: true}).Unmarshal(raw, settings); err != nil {
		fail(fmt.Errorf("%s does not read as IndividualSimSettings: %w", *in, err))
	}

	raid := &simproto.Raid{
		Parties: []*simproto.Party{{
			Players: []*simproto.Player{settings.GetPlayer()},
			Buffs:   settings.GetPartyBuffs(),
		}},
		Buffs:   settings.GetRaidBuffs(),
		Debuffs: settings.GetDebuffs(),
		Tanks:   settings.GetTanks(),
	}
	res := core.ComputeStats(&simproto.ComputeStatsRequest{
		Raid:         raid,
		Encounter:    settings.GetEncounter(),
		SkipRotation: true,
	})
	if res.GetRaidStats() == nil || len(res.GetRaidStats().GetParties()) == 0 ||
		len(res.GetRaidStats().GetParties()[0].GetPlayers()) == 0 {
		fail(fmt.Errorf("the sim returned no player stats for %s", *in))
	}
	player := res.GetRaidStats().GetParties()[0].GetPlayers()[0]
	final := player.GetFinalStats()

	stats := map[string]float64{}
	for i, v := range final.GetStats() {
		name, ok := simproto.Stat_name[int32(i)]
		if !ok || v == 0 {
			continue
		}
		stats[trim(name, "Stat")] = v
	}
	pseudo := map[string]float64{}
	for i, v := range final.GetPseudoStats() {
		name, ok := simproto.PseudoStat_name[int32(i)]
		if !ok || v == 0 {
			continue
		}
		pseudo[trim(name, "PseudoStat")] = v
	}

	doc := map[string]any{
		"stats":  stats,
		"pseudo": pseudo,
		"sets":   player.GetSets(),
	}
	data, err := json.MarshalIndent(doc, "", " ")
	if err != nil {
		fail(err)
	}
	if *out != "" {
		if err := os.WriteFile(*out, data, 0o644); err != nil {
			fail(err)
		}
		// A short readable summary on stdout helps when running this by hand.
		keys := make([]string, 0, len(stats))
		for k := range stats {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		fmt.Printf("%s: %d stats, %d pseudo, %d sets\n", *out, len(stats), len(pseudo), len(player.GetSets()))
		return
	}
	os.Stdout.Write(data)
	fmt.Println()
}

func trim(name, prefix string) string {
	if len(name) > len(prefix) && name[:len(prefix)] == prefix {
		return name[len(prefix):]
	}
	return name
}
