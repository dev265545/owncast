package controllers

import (
	"net/http"
	"strings"

	"github.com/owncast/owncast/core/data"
)

// GetRobotsDotTxt returns the contents of our robots.txt.
func GetRobotsDotTxt(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")
	contents := []string{
		"User-agent: *",
		"Disallow: /admin",
		"Disallow: /api",
	}

	if data.GetDisableSearchIndexing() {
		contents = append(contents, "Disallow: /")
	}

if _, err := w.Write([]byte(strings.Join(contents, "\n"))); err != nil {

	if _, err := w.Write(txt); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
