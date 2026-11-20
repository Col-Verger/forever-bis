// linkhash turns an IndividualSimSettings JSON file (the same one this repo
// writes to runs/<id>.settings.json) into a WoWSims share link: the settings
// as binary protobuf, zlib-deflated, base64, in the URL hash. That is exactly
// what the sim's own Link exporter writes (ui/sim/state/sim_links.ts), so a
// link opens the sim with this player, gear, buffs and rotation already loaded.
//
// Usage:
//
//	linkhash -in runs/mage-fire-max.settings.json -route mage/dps [-url]
//
// Prints just the hash, or with -url the full https://www.wowsims.com URL.
package main

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"flag"
	"fmt"
	"os"

	simproto "github.com/wowsims/forever/sim/core/proto"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

const siteBase = "https://www.wowsims.com/forever/"

func fail(err error) {
	fmt.Fprintln(os.Stderr, "linkhash:", err)
	os.Exit(1)
}

func main() {
	in := flag.String("in", "", "IndividualSimSettings JSON file")
	route := flag.String("route", "", "spec route under /forever/, e.g. mage/dps")
	full := flag.Bool("url", false, "print the full share URL instead of the bare hash")
	out := flag.String("out", "", "also write the result to this file")
	flag.Parse()

	if *in == "" {
		fail(fmt.Errorf("-in is required"))
	}
	raw, err := os.ReadFile(*in)
	if err != nil {
		fail(err)
	}

	settings := &simproto.IndividualSimSettings{}
	// DiscardUnknown keeps this working if a future sim export gains a field
	// this build's proto does not know about yet.
	if err := (protojson.UnmarshalOptions{DiscardUnknown: true}).Unmarshal(raw, settings); err != nil {
		fail(fmt.Errorf("%s does not read as IndividualSimSettings: %w", *in, err))
	}

	bin, err := proto.Marshal(settings)
	if err != nil {
		fail(err)
	}

	var deflated bytes.Buffer
	zw, err := zlib.NewWriterLevel(&deflated, zlib.BestCompression)
	if err != nil {
		fail(err)
	}
	if _, err := zw.Write(bin); err != nil {
		fail(err)
	}
	if err := zw.Close(); err != nil {
		fail(err)
	}

	hash := base64.StdEncoding.EncodeToString(deflated.Bytes())
	result := hash
	if *full {
		if *route == "" {
			fail(fmt.Errorf("-route is required with -url"))
		}
		result = siteBase + *route + "/#" + hash
	}

	if *out != "" {
		if err := os.WriteFile(*out, []byte(result), 0o644); err != nil {
			fail(err)
		}
	}
	fmt.Println(result)
}
