let advancedOptions = {
    hidden: false,
    exclusionCheckboxes: []
};

let form = document.getElementsByTagName("form")[0];
let formButtons = document.getElementById("form-buttons");
let advancedOptionsSpans = formButtons.children[1].getElementsByTagName("span");
let showAdvancedOptionsSpan = advancedOptionsSpans[0];
let hideAdvancedOptionsSpan = advancedOptionsSpans[1];

formButtons.children[1].addEventListener("click", () => {
    advancedOptions.hidden = !advancedOptions.hidden;
    let [spanToShow, spanToHide] = advancedOptions.hidden? [showAdvancedOptionsSpan, hideAdvancedOptionsSpan] : [hideAdvancedOptionsSpan, showAdvancedOptionsSpan];
    spanToShow.style.display = "inline";
    spanToHide.style.display = "none";

    advancedOptionsFieldset.style.display = advancedOptions.hidden? "none" : "flex";
});

showAdvancedOptionsSpan.style.display = "none";
hideAdvancedOptionsSpan.style.display = "inline";

let advancedOptionsFieldset = document.createElement("fieldset");

let advancedOptionsFieldsetLegend = document.createElement("legend");
advancedOptionsFieldsetLegend.textContent = "Advanced options";
advancedOptionsFieldset.appendChild(advancedOptionsFieldsetLegend);

let configureExclusionsOptionButton = document.createElement("button");
configureExclusionsOptionButton.type = "submit";
configureExclusionsOptionButton.textContent = "Configure exclusions";
configureExclusionsOptionButton.addEventListener("click", () => {
    pairs.names = window.getParticipantNames();
    // If names < 3 we return thus allowing the browser to require from the user to enter data in the required input fields.
    // Else by continuing and removing the fieldsets (in particular this submit button) we cancel the on submit event.
    // All of that so we can have the browser require from the user at least 3 names.
    if (pairs.names.length < 3) return;

    for (const fieldset of document.querySelectorAll("fieldset")) {
        fieldset.remove();
    }

    formButtons.style.flexDirection = "column";
    formButtons.children[0].style.display = "none";
    formButtons.children[1].style.display = "none";

    let configureExclusionsFieldset = document.createElement("fieldset");

    let configureExclusionsFieldsetLegend = document.createElement("legend");
    configureExclusionsFieldsetLegend.textContent = "Select anyone that cannot be the secret santa of a participant";
    configureExclusionsFieldset.appendChild(configureExclusionsFieldsetLegend);

    advancedOptions.exclusionCheckboxes = Array.from(Array(pairs.size), () => []);

    for (const [i, name] of pairs.names.entries()) {
        let exclusionDetails = document.createElement("details");
        exclusionDetails.style.display = "flex";
        configureExclusionsFieldset.appendChild(exclusionDetails);

        let exclusionSummary = document.createElement("summary");
        exclusionSummary.style.padding = "0.25rem";
        exclusionSummary.textContent = name;
        exclusionDetails.appendChild(exclusionSummary);

        for (const [j, potentialPairName] of pairs.names.entries()) {
            if (i === j) continue;

            let potentialPairLabel = document.createElement("label");
            potentialPairLabel.style.marginTop = "0.5rem";

            let potentialPairInput = document.createElement("input");
            advancedOptions.exclusionCheckboxes[i].push({index: j, input: potentialPairInput});
            potentialPairInput.type = "checkbox";
            potentialPairInput.addEventListener("change", () => {
                const uncheckedSiblingInputs = advancedOptions.exclusionCheckboxes[i].filter(({input}) => potentialPairInput !== input && !input.checked);

                if (uncheckedSiblingInputs.length === 1) {
                    uncheckedSiblingInputs[0].input.disabled = potentialPairInput.checked;
                }
            });
            potentialPairLabel.appendChild(potentialPairInput);

            potentialPairLabel.appendChild(document.createTextNode(potentialPairName));

            exclusionDetails.appendChild(potentialPairLabel);
        }
    }

    form.insertBefore(configureExclusionsFieldset, formButtons);
});
advancedOptionsFieldset.appendChild(configureExclusionsOptionButton);

form.insertBefore(advancedOptionsFieldset, formButtons);

const getParticipantNamesFromForm = window.getParticipantNames;
window.getParticipantNames = () => {
    if (advancedOptions.exclusionCheckboxes.length) {
        return pairs.names;
    } else {
        return getParticipantNamesFromForm();
    }
}

const shuffleIndexes = window.generateIndexes;
window.generateIndexes = () => {
    const exclusionIndexes = advancedOptions.exclusionCheckboxes.map((potentialSecretSantas) =>
        potentialSecretSantas.filter((checkbox) => checkbox.input.checked).map((checkbox) => checkbox.index));

    const entTimestamp = performance.now() + 250;
    while (performance.now() < entTimestamp) {
        const pairIndexes = shuffleIndexes();

        if (pairIndexes.every((secretSanta, i) => !exclusionIndexes[i]?.includes(secretSanta) ?? true)) {
            return pairIndexes.map((secretSanta) => pairIndexes[secretSanta]);
        }
    }

    let errorDiv = document.createElement("div");
    errorDiv.style.border = "0.25ch solid red";
    errorDiv.style.padding = "0.5ch";
    errorDiv.style.background = "#ff000080";
    errorDiv.style.textAlign = "center";
    errorDiv.textContent = "You have configured exclusions that prevent certain participants from being paired with anyone";
    form.appendChild(errorDiv);

    document.getElementById("all-links-article").style.display = "";
    document.addEventListener("click", () => errorDiv.remove(), {once: true});

    return false;
}