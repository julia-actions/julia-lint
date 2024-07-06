using Pkg
Pkg.activate(@__DIR__)
Pkg.instantiate()

using JuliaWorkspaces
using JuliaWorkspaces.URIs2: uri2filepath

println("WE ARE ON JULIA $VERSION in folder $(pwd())")

jw = workspace_from_folders([pwd()])

files = get_text_files(jw)

println("We have files $files")

global fail_lint_pass = false

for file in files
    diagnostics = get_diagnostic(jw, file)

    println("And diagnostics $diagnostics")

    for diag in diagnostics
        if diag.severity == :error || diag.severity == :warning
            text_file = get_text_file(jw, file)

            start_pos = position_at(text_file.content, diag.range.start)
            end_pos = position_at(text_file.content, diag.range.stop)

            println("::$(diag.severity) file=$(uri2filepath(file)),line=$(start_pos[1]),endLine=$(end_pos[1]),col=$(start_pos[2]),endColumn=$(end_pos[2]),title=$(diag.source)::$(diag.message)")
        end

        if diag.severity == :error
            global fail_lint_pass = true
        end
    end
end

if fail_lint_pass
    exit(1)
end
